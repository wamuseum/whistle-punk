const defaultsDeep = require('lodash.defaultsdeep');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const forEach = require('lodash.foreach');
const fs = require('fs');
const merge = require('lodash.merge');
const path = require('path');
const { checkHttpUrl, findCandidateFile } = require('./utils');

let windowObjects = [];

// IPC listener
ipcMain.on('_window', async (event, message) => {
  console.log(event.sender.getOwnerBrowserWindow()?.opts?.id, message);
  event.returnValue = message;
  event.sender.send('_window', 'Hi Yourself');
});

function loadWindow(opts) {
  let _opts = defaultsDeep(opts || {}, {
    userAgent: 'Whistle Punk/' + require('../package.json').version,
    enableLargerThanScreen: true,
  });

  let windowObject = new BrowserWindow(_opts);
  windowObject.opts = _opts;

  windowObject.loadURL(windowObject.opts.url);
  windowObject.webContents
  .on('dom-ready', () => {
    // sending our optional scripts to the preload window listener
    if (opts?.scripts) {
      windowObject.webContents.send('_scriptsToInject', opts?.scripts);
    }
    // _this.send('dom-ready')
  })

  // disable all new window/tab opening
  windowObject.webContents.setWindowOpenHandler((details) => {
    return { action: 'deny' }
  });

  windowObject.webContents.on('will-frame-navigate',(details) => {
    let linkDomain = checkHttpUrl(details?.url)?.hostname;
    if (!linkDomain || windowObject?.opts?.domainWhitelist?.some(domain => linkDomain.includes(domain))) {
      console.log('navigating to: ' + details.url);
    } else {
      details.preventDefault();
      console.log('blocked: ' + details.url)
    }
  });

  // @TDO: put behind a switch
  windowObject.on('unresponsive', (event) => {
    console.log('unresonsive')
    resetWindows();
  });
  windowObject.webContents.on('crashed', (event) => {
    console.log('crashed')
    resetWindows();
  });

  if (windowObject?.opts?.debug) {
    windowObject.webContents.openDevTools();
  }

  windowObject.webContents.on('did-finish-load',() => {
    forEach(windowObject.opts?.css, (value, index) => {
      fs.readFile(value.path,  (error, data) => {
        if (!error) {
          windowObject.webContents.insertCSS(data.toString());
        }
        else {
          console.log(`Error adding ${value.path} css`);
        }
      });
    });
  });

  return windowObject;
}

function loadWindows (config) {
  let displays = screen.getAllDisplays();
  for (var key in config.windows) {
    config.windows[key].x =  displays[config.windows[key].display].workArea.x + config.windows[key].x;
    config.windows[key].y = displays[config.windows[key].display].workArea.y + config.windows[key].y;
    if (config.windows[key].fullscreen) {
      delete config.windows[key].width;
      delete config.windows[key].height;
      delete config.windows[key].x;
      delete config.windows[key].y;
    }

    if (config?.sslexceptions) {
      config.windows[key].sslExceptions = config.sslexceptions;
    }

    if (config?.shortcut) {
      config.windows[key].shortcut = merge(config.shortcut, config.windows[key].shortcut);
    }

    config.windows[key].domainWhitelist = [];
    if (config?.domainwhitelist) {
      config.windows[key].domainWhitelist = [
        ...(Array.isArray(config?.domainwhitelist) ? config?.domainwhitelist : [config?.domainwhitelist])
      ]
    }

    let link = checkHttpUrl(config.windows[key]?.url);
    link?.hostname && config.windows[key]?.domainWhitelist?.push(link?.hostname);

    config.windows[key].scripts = merge(config?.injectscripts, config?.windows?.[key]?.injectscripts);

    // remove scripts that cannot be found on disk
    forEach(config?.windows?.[key]?.scripts, (value, index) => {
      config.windows[key].scripts[index].path =
        findCandidateFile(config.basePath, config.windows[key].scripts[index].path) ||
        delete config.windows[key].scripts[index];
    });

    config.windows[key].css = merge(config?.injectcss, config?.windows?.[key]?.injectcss);

    // remove css that cannot be found on disk
    forEach(config?.windows?.[key]?.css, (value, index) => {
      config.windows[key].css[index].path =
        findCandidateFile(config.basePath, config.windows[key].css[index].path) ||
        delete config.windows[key].css[index];
    });

    config.windows[key].webPreferences = {
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      partition: 'persist:my-partition'
    }

    config.flags = merge(config?.flags, config?.windows?.[key]?.flags);

    for (let key in config?.flags) {
      if (config?.flags?.[key]?.flag) {
        app.commandLine.appendSwitch(config?.flags?.[key]?.flag);
      }
    }

    config.windows[key].id = key;
    windowObjects[key] = loadWindow(config.windows[key]);
  }
}

async function resetWindows (reload = false, cache = false) {
  for( var key in windowObjects) {
    if(!cache) {
      await windowObjects[key].webContents.session.clearCache();
    }
    let pageLoad = await windowObjects[key].loadURL(windowObjects[key].opts.url);
    if (reload) {
      windowObjects[key].reload();
    }
  }
}

module.exports = {
  loadWindows,
  resetWindows
}