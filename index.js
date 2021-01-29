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

    oakObjects[index] = oak.load(oakWindow)
    oakObjects[index].on('unresponsive', function(event) {
      console.log('page has become unresponsive')
      this.location(this.opts.url)
    })
    oakObjects[index].on('loadFailed', function(event) {
      console.log('page failed to load')
      // this.location(this.opts.url)
    })
  })

}

// everything has to wait for the main ready event to fire
oak.on('ready', () => {
  oakWindows.map(value => {
    value.url = value.url.startsWith("http") ? value.url : join(__dirname, value.url)
  })
  let waitFor = oakWindows.map(value => value.url)
  console.log("waitFor: ", waitFor)
  console.log(oakWindows)
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