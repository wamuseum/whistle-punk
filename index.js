const config = require('config')
const express = require('express')
const fs = require('fs')
const { join } = require('path')
const oak = require('oak')
const path = require('path')
const union = require('lodash.union')
const waitOn = require('wait-on')

require('dotenv').config()
if (! (oakWindows = config.has('windows') ? config.windows : false)) {
  console.log('Error loading oakWindows config')
  process.exit(1)
}

oakObjects = []

function loadWindow(opts) {
  windowObject = oak.load(opts)
  windowObject.on('unresponsive', function(event) {
    console.log('page has become unresponsive: ' + this.opts.url)
    this.location(this.opts.url)
  })
  windowObject.on('crashed', function(event) {
    console.log('crashed')
    console.log(this.opts)
    loadWindow(this.opts)
    this.close()

    //this.location(this.opts.url)
  })
  windowObject.on('devtools-opened', function(event) {
    console.log('dev tools opened: ' + this.opts.url)
    // this.location(this.opts.url)
  })
  windowObject.on('loadFailed', function(event) {
    console.log('page failed to load')
    // this.location(this.opts.url)
  })
  // windowObject.on('gpu-info-update', () => {
  //   console.log('GPU Information has been Updated');
  //   this.getGPUInfo('complete').then(completeObj => {
  //     console.dir(completeObj);
  //   });
  // });
  // oak.app.getGPUInfo('basic').then(completeObj => {
  //   console.dir(completeObj);
  // });
  // console.dir(oak.app.getGPUFeatureStatus())
  windowObject.debug()

  return windowObject
}

function loadWindows () {
  let displays = oak.getDisplays()

  oakWindows.forEach(function(oakWindow, index) {
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
    if (oakWindow.scripts) {
      oakWindow.scripts.forEach(function(part, index, scripts) {
        scripts[index] = path.resolve(part)
      })
      oakWindow.scripts.some(function(script) {
        console.log(script)
        if (fs.existsSync(script)) {
          return false
        } else {
          delete oakWindow.scripts
          console.log('missing script')
          return true
        }
      })
    }
    // console.log(oakWindow)
    oakObjects[index] = loadWindow(oakWindow)
  })

}

// everything has to wait for the main ready event to fire
oak.on('ready', () => {
  oakWindows.map(value => {
    value.url = value.url.startsWith("http") ? value.url : 'file://' + join(__dirname, value.url)
  })
  let waitFor = oakWindows.map(value => value.url)
  console.log("waitFor: ", waitFor)

  let opts = {
    resources: waitFor
  }
  waitOn(opts, function (err) {
    if (err) {
      return handleError(err);
    }
    // once here, all resources are available
    loadWindows()
  });
})