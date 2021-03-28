process.env["NODE_CONFIG_DIR"] = __dirname + "/config/" + require('path').delimiter + __dirname + "/config-override/"
const config = require('config')
const loadWindows = require('./window.js')
const oak = require('oak')
const os = require('os')
const path = require('path')
const waitOn = require('wait-on')

if (!config.has('windows')) {
  console.log('Error loading oakWindows config')
  process.exit(1)
}

oak.on('ready', () => {
  /*
   * Get a list of URI's needed for all the windows and use wait-for to wait
   * until they are all available. eg. wait for a local apache instance to load.
   */
  let filePrefix = os.platform() == 'win32' ? '' : 'file://'
  config.windows.map(value => {
    value.url = value.url.startsWith("http") ? value.url :  filePrefix + path.join(__dirname, value.url)
  })
  let waitFor = config.windows.map(value => value.url)

  waitOn({ resources: waitFor }, function (err) {
    if (err) {
      console.log(err)
    }
    // once here, all resources are available
    loadWindows()
  });
})