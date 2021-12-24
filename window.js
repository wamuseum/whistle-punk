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
  windowObject.on('unresponsive', function(event) {
    console.log('page has become unresponsive: ' + this.opts.url)
    this.loadPage()
  })
  windowObject.on('crashed', function(event) {
    console.log('crashed')
    loadWindow(this.opts)
    this.close()
  })
  windowObject.on('loadFailed', function(event) {
    console.log('page failed to load')
    this.loadPage()
  })
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
          globalScripts.push(config.injectscripts[globalScriptsKey].injectscripts.script)
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
      // check that all injected scripts exits and remove them all if any are not found
      config.windows[key].scripts.forEach(function(part, index, scripts) {
        scripts[index] = fs.existsSync(path.resolve(path.join(__dirname, part))) ? path.resolve(path.join(__dirname, part)) : path.resolve(part)
      })
      config.windows[key].scripts.some(function(script) {
        if (fs.existsSync(script)) {
          return false
        } else {
          delete config.windows[key].scripts
          console.log('missing script')
          return true
        }
      })
    }
    oakObjects[key] = loadWindow(config.windows[key])
  }
  //console.dir(oak.app.getGPUFeatureStatus())
}

async function resetWindows (cache) {
  for( var key in oakObjects) {
    let pageLoad = oakObjects[key].loadPage()
    pageLoad.once('did-finish-load', () => {
      console.log('hi')
      pageLoad.reload()
    })
  }
}

const requestListener = function (req, res) {
  switch (req.url) {
    case "/reset":
      resetWindows(false)
      res.writeHead(200)
      res.end('Success')
      break
    case "/reset-cached":
      resetWindows(true)
      res.writeHead(200)
      res.end('Success')
      break
  }
}

if (config.has('server.host')) {
  const server = http.createServer(requestListener)
  server.listen(config.server.port, config.server.host, () => {
    console.log(`Server is running on http://${config.server.host}:${config.server.port}`)
  })
}

module.exports = loadWindows