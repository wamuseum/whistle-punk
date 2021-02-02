const { join } = require('path')
const oak = require('oak')
const waitOn = require('wait-on')
const express = require('express')
const config = require('config')

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
    console.log(oakWindow)
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