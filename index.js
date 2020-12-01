const oak = require('oak')
const waitOn = require('wait-on')
const express = require('express')

require('dotenv').config()

function loadWindow () {

  let exceptions = ['localhost']
  let displays = oak.getDisplays()
  let display = parseInt(process.env.DISPLAY_ID) || 2
  let url = process.env.REMOTE_URL || 'https://museum.wa.gov.au/'
  let background = process.env.BACKGROUND_COLOR || '#ffffff'
  let ontop = Boolean(process.env.WINDOW_ONTOP) || false
  let insecure = Boolean(process.env.WINDOW_INSECURE)  || false
  let kiosk = Boolean(process.env.KIOSK) || false
  let fullscreen = Boolean(process.env.FULLSCREEN) || false

  //console.log("Displays: ",JSON.stringify(displays))

  let opts = {
    url,
    background,
    display,
    ontop,
    size: displays[display].workArea.width + "x" + displays[display].workArea.height,
    x: displays[display].workArea.x,
    y: displays[display].workArea.y,
    sslExceptions:  exceptions,
    insecure,
    kiosk,
    fullscreen
  }
  if (opts.fullscreen) {
    delete opts.size
  }

  // let opts = process.env
  if (process.env.SSL_EXCEPTIONS) {
    opts.sslExceptions = process.env.SSL_EXCEPTIONS.split(';')
  }

  console.log("Options: ", opts)

  oak.load(opts)

}

// everything has to wait for the main ready event to fire
oak.on('ready', () => {
  let waitFor = [process.env.REMOTE_URL || 'https://museum.wa.gov.au/'];
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
    loadWindow()
  });

})