const fs = require('fs')
const merge = require('lodash.merge')
const defaultsDeep = require('lodash.defaultsdeep');
const {app, BrowserWindow, ipcMain, screen} = require('electron');
const path = require('path')
const union = require('lodash.union')
const {checkHttpUrl} = require('./utils')
const {join} = require("path");

let windowObjects = []

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
    // console.dir(windowObject);
    if (opts?.scripts) {
      windowObject.webContents.send('_scriptsToInject', opts?.scripts);
    }
    // _this.send('dom-ready')
  })

  windowObject.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    console.log('blocked new window: ' + url)
  });
  windowObject.webContents.on("will-navigate", function(event, url) {
    let linkDomain = checkHttpUrl(url)?.hostname;
    console.log(event?.sender?.getOwnerBrowserWindow());
    if (!linkDomain || event?.sender?.getOwnerBrowserWindow()?.opts?.domainWhitelist?.some(v => linkDomain.includes(v))) {
      console.log('navigating to: ' + url);
    } else {
      event.preventDefault();
      console.log('blocked: ' + url)
    }
  });

  windowObject.on('unresponsive', (event) => {
    console.log('unresonsive')
    resetWindows();
  });
  windowObject.webContents.on('crashed', (event) => {
    console.log('crashed')
    resetWindows();
  });

  return windowObject
}

function loadWindows (config) {
  let displays = screen.getAllDisplays();
  for (var key in config.windows) {
    config.windows[key].x =  displays[config.windows[key].display].workArea.x + config.windows[key].x
    config.windows[key].y = displays[config.windows[key].display].workArea.y + config.windows[key].y
    if (config.windows[key].fullscreen) {
      delete config.windows[key].width
      delete config.windows[key].height
      delete config.windows[key].x
      delete config.windows[key].y
    }

    if (config?.sslexceptions) {
      config.windows[key].sslExceptions = config.sslexceptions
    }

    if (config?.flags) {
      let globalFlags = []
      for (let globalFlagKey in config.flags) {
        if (config.flags[globalFlagKey] && config.flags[globalFlagKey].hasOwnProperty('flag')) {
          globalFlags.push(config.flags[globalFlagKey].flag)
        }
      }
      config.windows[key].flags = globalFlags
    }

    if (config?.shortcut) {
      config.windows[key].shortcut = merge(config.shortcut, config.windows[key].shortcut)
    }

    config.windows[key].domainWhitelist = [];
    if (config?.domainwhitelist) {
      config.windows[key].domainWhitelist = [
        ...(Array.isArray(config?.domainwhitelist) ? config?.domainwhitelist : [config?.domainwhitelist])
      ]
    }

    let link = checkHttpUrl(config.windows[key]?.url);
    link?.hostname && config.windows[key]?.domainWhitelist?.push(link?.hostname);

    let globalScripts = []
    if (config?.injectscripts) {
      for (let globalScriptsKey in config.injectscripts) {
        if (config.injectscripts[globalScriptsKey] && config.injectscripts[globalScriptsKey].hasOwnProperty('script')) {
          globalScripts.push(config.injectscripts[globalScriptsKey].script)
        }
      }
    }

    let windowScripts = []
    if (config.windows[key].hasOwnProperty('injectscripts')) {
      for (let windowScriptsKey in config.windows[key].injectscripts) {
        if (config.windows[key].injectscripts[windowScriptsKey] && config.windows[key].injectscripts[windowScriptsKey].hasOwnProperty('script')) {
          windowScripts.push(config.windows[key].injectscripts[windowScriptsKey].script)
        }
      }
    }

    if (globalScripts.length || windowScripts.length) {
      config.windows[key].scripts = union(globalScripts, windowScripts)
    } else {
      delete(config.windows[key].scripts)
    }

    if (config.windows[key].hasOwnProperty('scripts')) {
      // remove scripts that cannot be found on disk
      config.windows[key].scripts.forEach(function(part, index, scripts) {
        scripts[index] = path.resolve(__dirname, part)
        if (!fs.existsSync(scripts[index])) {
          config.windows[key].scripts.splice(index,1)
        }
      })
      if (!config.windows[key].scripts.length) {
        delete config.windows[key].scripts
      }
    }

    config.windows[key].webPreferences = {
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      partition: 'persist:my-partition'
    }

    //console.log(config.windows[key])
    // process.exit()
    for (let key in config?.flags) {
      if (config?.flags?.[key]?.flag) {
        // console.log(config?.flags?.[key]?.flag)
        app.commandLine.appendSwitch(config?.flags?.[key]?.flag)
  }
    }
    config.windows[key].id = key;
    console.log(key)
    windowObjects[key] = loadWindow(config.windows[key])
    //console.dir(windowObjects[key])
    // windowObjects[key].webContents.openDevTools();
  }
  // app.getGPUInfo('complete').then(completeObj => {
  //   console.dir(completeObj);
  // });
  // console.dir(app.getGPUFeatureStatus());
}

async function resetWindows (reload = false, cache = false) {
  for( var key in windowObjects) {
    let pageLoad = windowObjects[key].loadURL(windowObjects[key].opts.url);
    if (reload) {
      // pageLoad.once('did-finish-load', () => {
      windowObjects[key].reload(cache)
      // })
    }
  }
}

module.exports = {
  loadWindows,
  resetWindows
}