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
  let sslExceptions = config.get('sslexceptions')
  let displays = oak.getDisplays()

  oakWindows.forEach(function(oakWindow, index){
    let opts = {
      ...oakWindow,
      x: displays[oakWindow.display].workArea.x,
      y: displays[oakWindow.display].workArea.y,
      sslExceptions:  sslExceptions
    }
    if (opts.fullscreen) {
      delete opts.size
    }
    oakObjects[index] = oak.load(opts)
    oakObjects[index].on('unresponsive', function(event) {
      console.log('page has become unresponsive')
      this.location(this.opts.url)
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