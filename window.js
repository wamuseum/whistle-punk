const config = require('config')
const fs = require('fs')
const merge = require('lodash.merge')
const oak = require('oak')
const path = require('path')
const union = require('lodash.union')

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
  let oakObjects = []
  config.windows.forEach(function(oakWindow, index) {
    oakWindow.x =  displays[oakWindow.display].workArea.x + oakWindow.x
    oakWindow.y = displays[oakWindow.display].workArea.y + oakWindow.y
    if (oakWindow.fullscreen) {
      delete oakWindow.size
      delete oakWindow.x
      delete oakWindow.y
    }
    if (config.has('sslexceptions')) {
      oakWindow.sslExceptions = config.sslexceptions
    }
    if (config.has('flags')) {
      oakWindow.flags = union(config.flags, oakWindow.flags)
    }
    if (config.has('shortcut')) {
      oakWindow.shortcut = merge(config.shortcut, oakWindow.shortcut)
    }
    if (oakWindow.scripts) {
      // check that all injected scripts exits and remove them all if any are not found
      oakWindow.scripts.forEach(function(part, index, scripts) {
        scripts[index] = path.resolve(part)
      })
      oakWindow.scripts.some(function(script) {
        if (fs.existsSync(script)) {
          return false
        } else {
          delete oakWindow.scripts
          console.log('missing script')
          return true
        }
      })
    }
    oakObjects[index] = loadWindow(oakWindow)
  })
  //console.dir(oak.app.getGPUFeatureStatus())
}

module.exports = loadWindows