const fs = require('fs')
const merge = require('lodash.merge')
const oak = require('oak')
const path = require('path')
const union = require('lodash.union')

let oakObjects = []

function loadWindow(opts) {
<<<<<<<< HEAD:window.js
  let windowObject = oak.load(opts)
  if (!opts.hasOwnProperty('crashprevention') || (opts.hasOwnProperty('crashprevention') && opts.crashprevention)) {
    console.log('Crash Prevention')
    windowObject.on('unresponsive', function (event) {
      console.log('page has become unresponsive: ' + this.opts.url)
      this.loadPage()
    })
    windowObject.on('crashed', function (event) {
      console.log('crashed')
      loadWindow(this.opts)
      this.close()
    })
    windowObject.on('loadFailed', function (event) {
      console.log('page failed to load')
      this.loadPage()
    })
  }
  return windowObject
}

function loadWindows () {
  let displays = oak.getDisplays()
========
  let windowObject = new BrowserWindow(opts);
  windowObject.opts = opts;

  windowObject.loadURL(opts.url);
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
    if (url === '') {
      event.preventDefault();
      console.log('blocked: ' + url)
    } else {
      console.log('navigating to: ' + url);
    }
  });

  return windowObject
}

function loadWindows (config) {
  let displays = screen.getAllDisplays();
>>>>>>>> b1c48ee (switch to yargs):lib/window.js
  for (var key in config.windows) {
    config.windows[key].x =  displays[config.windows[key].display].workArea.x + config.windows[key].x
    config.windows[key].y = displays[config.windows[key].display].workArea.y + config.windows[key].y
    if (config.windows[key].fullscreen) {
      delete config.windows[key].size
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
    oakObjects[key] = loadWindow(config.windows[key])
  }
  //console.dir(oak.app.getGPUFeatureStatus())
  // app.getGPUInfo('complete').then(completeObj => {
  //   console.dir(completeObj);
  // });
  // console.dir(app.getGPUFeatureStatus());
}

async function resetWindows (reload = false, cache = false) {
  for( var key in oakObjects) {
    let pageLoad = oakObjects[key].loadPage()
    if (reload) {
      pageLoad.once('did-finish-load', () => {
        pageLoad.reload(cache)
      })
    }
  }
}

module.exports = {
  loadWindows,
  resetWindows
}