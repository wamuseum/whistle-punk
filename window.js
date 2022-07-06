const config = require('config')
const fs = require('fs')
const http = require("http")
const merge = require('lodash.merge')
const oak = require('oak')
const path = require('path')
const union = require('lodash.union')

let oakObjects = []

function loadWindow(opts) {
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