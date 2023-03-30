const config = require('config')
const fs = require('fs')
const http = require("http")
const merge = require('lodash.merge')
const {app, BrowserWindow, ipcMain, screen} = require('electron');
const path = require('path')
const union = require('lodash.union')

let oakObjects = []

// IPC listener
ipcMain.on('_window', async (event, message) => {
  console.log(message);
  event.returnValue = message;
  event.sender.send('_window', 'Hi Yourself');
});

function loadWindow(opts) {
  let windowObject = new BrowserWindow(opts);
  windowObject.opts = opts;

  windowObject.loadURL(opts.url);
  windowObject.webContents
  .on('dom-ready', () => {
    // sending our optional scripts to the preload window listener
    // console.dir(windowObject);
    windowObject.webContents.send('_scriptsToInject', opts?.scripts);
    // _this.send('dom-ready')
  })

  windowObject.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    console.log('blocked new window: ' + url)
  });
  windowObject.webContents.on("will-navigate", function(event, url) {
    if (url === '') {
      event.preventDefault();
      console.log('blocked: ' + url)
    } else {
      console.log('navigating to: ' + url);
    }
  });

  return windowObject
}

function loadWindows () {
  let displays = screen.getAllDisplays();
  for (var key in config.windows) {
    config.windows[key].x =  displays[config.windows[key].display].workArea.x + config.windows[key].x
    config.windows[key].y = displays[config.windows[key].display].workArea.y + config.windows[key].y
    if (config.windows[key].fullscreen) {
      delete config.windows[key].size
      delete config.windows[key].x
      delete config.windows[key].y
    }

    if (config.has('sslexceptions')) {
      config.windows[key].sslExceptions = config.sslexceptions
    }

    if (config.has('flags')) {
      let globalFlags = []
      for (let globalFlagKey in config.flags) {
        if (config.flags[globalFlagKey] && config.flags[globalFlagKey].hasOwnProperty('flag')) {
          globalFlags.push(config.flags[globalFlagKey].flag)
        }
      }
      config.windows[key].flags = globalFlags
    }

    if (config.has('shortcut')) {
      config.windows[key].shortcut = merge(config.shortcut, config.windows[key].shortcut)
    }

    let globalScripts = []
    if (config.has('injectscripts')) {
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
        scripts[index] = path.resolve(part)
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
    }

    oakObjects[key] = loadWindow(config.windows[key])
    oakObjects[key].webContents.openDevTools();
  }
  //console.dir(oak.app.getGPUFeatureStatus())
}

async function resetWindows (reload = false, cache = false) {
  for( var key in oakObjects) {
    let pageLoad = oakObjects[key].loadURL(oakObjects[key].opts.url);
    if (reload) {
      // pageLoad.once('did-finish-load', () => {
      oakObjects[key].reload(cache)
      // })
    }
  }
}

const requestListener = function (req, res) {
  switch (req.url) {
    case "/reset":
      resetWindows()
      res.writeHead(200)
      res.end('Success\n')
      break
    case "/reload":
      resetWindows(true, false)
      res.writeHead(200)
      res.end('Success\n')
      break
    default:
      res.writeHead(404)
      res.end('404 not found\n')
  }
}

if (config.has('server.host')) {
  const server = http.createServer(requestListener)
  server.listen(config.server.port, config.server.host, () => {
    console.log(`Server is running on http://${config.server.host}:${config.server.port}`)
  })
}

module.exports = loadWindows