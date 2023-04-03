const yaml = require('js-yaml');
const fs   = require('fs');
const args = require('./lib/args.js')
const {loadWindows} = require('./lib/window.js');
const { app } = require('electron');
const os = require('os')
const path = require('path')
const waitOn = require('wait-on')
const { setUpServer } = require('./lib/server');

let config = {};

if (args.deBug) {
  console.dir(args);
}

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

if (args?._?.[0]?.length && args?._?.[0].match(/\.ya?ml$/)) {
  try {
    config = yaml.load(fs.readFileSync(path.resolve(args?._?.[0]),  'utf8'));
  }
  catch (error) {
    console.log(error);
    process.exit(1);
  }
}
else {
  if (args?._?.[0]?.length) {
    config = {
      windows: {
        default: {
          url: args?._?.[0],
          display: 0,
        }
      }
    }
  }
  else {
    console.log('Invalid');
    process.exit(1);
  }
}

if (!config?.windows) {
  console.log('Error loading oakWindows config')
  process.exit(1)
}

if (config?.server) {
  setUpServer(config);
}
app.whenReady().then(() => {
  let filePrefix = os.platform() == 'win32' ? '' : 'file://'

  for (let key in config.windows) {
    if (config.windows[key] && config.windows[key].hasOwnProperty('url')) {
      config.windows[key].url = config.windows[key].url.startsWith("http") ? config.windows[key].url : filePrefix + path.join(__dirname, config.windows[key].url)
    }
    else {
      // window has been removed by setting to false
      delete (config.windows[key])
    }
  }

  if (config?.waitforurls && config.waitforurls) {
    /*
     * Get a list of URI's needed for all the windows and use wait-for to wait
     * until they are all available. eg. wait for a local apache instance to load.
     */
    let waitFor = [] //= config.windows.map(value => value.url)
    for (var key in config.windows) {
      waitFor.push(config.windows[key].url)
    }
    if (config.has('extrawaitforurls')) {
      for (var key in config.extrawaitforurls) {
        if (config.extrawaitforurls[key].hasOwnProperty('url')) {
          waitFor.push(config.extrawaitforurls[key].url)
        }
      }
    }

    waitOn({resources: waitFor}, function (err) {
      if (err) {
        console.log(err)
      }
      // once here, all resources are available
      loadWindows(config)
    });
  }
  else {
    loadWindows(config)
  }
}).catch(console.error);