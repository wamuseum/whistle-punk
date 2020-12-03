const { join } = require('path')
const oak = require('oak')
const waitOn = require('wait-on')
const express = require('express')
const config = require('config')

require('dotenv').config()
oakWindows = config.get('windows')
oakObjects = []

function loadWindows () {
  let sslExceptions = config.get('sslexceptions')
  let displays = oak.getDisplays()
  //let errors = oak.catchErrors()
  //let log = oak.log

  //console.log("Displays: ",JSON.stringify(displays))
  oakWindows.forEach(function(oakWindow, index){
    let opts = {
      ...oakWindow,
      //size: displays[oakWindow.display].workArea.width + "x" + displays[oakWindow.display].workArea.height,
      //x: displays[oakWindow.display].workArea.x,
      //y: displays[oakWindow.display].workArea.y,
      sslExceptions:  sslExceptions
    }

    opts.url = opts.url.startsWith("http") ? opts.url : 'file://' + join(__dirname,opts.url)
    if (opts.fullscreen) {
      delete opts.size
    }
    //console.log("Options: ", opts)
    oakObjects[index] = oak.load(opts)
    oakObjects[index].on('unresponsive', function(event) {
      this.reload()
    })
  })
}

// everything has to wait for the main ready event to fire
oak.on('ready', () => {
  let waitFor = oakWindows.map(value => value.url.startsWith("http") ? value.url : join(__dirname,value.url))
  if (process.env.WAIT_ON) {
    waitFor = process.env.WAIT_ON.split(";")
  }
  console.log("waitFor: ", waitFor)
  let opts = {
    resources: waitFor
  }
  waitOn(opts, function (err) {
    if (err) { return handleError(err); }
    // once here, all resources are available
    loadWindows()
  });
})