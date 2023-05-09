const yaml = require('js-yaml');
const fs   = require('fs');
const args = require('./lib/args.js')
const os = require('os')
const path = require('path')
const waitOn = require('wait-on')
const {minimatch} = require("minimatch");

if (args.deBug) {
  console.dir(args);
}

if (args?._?.[0]?.length && args?._?.[0]?.match(/\.js$/)) {
  // hand over to javascript file that replaces whistle-punk
  require(args?._?.[0]);
}
else {
  // Continue with Whistle Punk...
  let config = {};
  if (args?._?.[0]?.length && args?._?.[0]?.match(/\.ya?ml$/)) {
    try {
      config = yaml.load(fs.readFileSync(path.resolve(args?._?.[0]),  'utf8'));
    }
    catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
  else { // load single url using yargs params
    if (args?._?.[0]?.length) {
      config = {
        windows: {
          default: {}
        }
      }
      config.windows.default.url =  args?._?.[0];
      config.windows.default.frame = args?.frame;
      if (!(args?.x || args?.y || args.width || args?.height)) {
        config.windows.default.fullscreen = args?.fullscreen;
        config.windows.default.kiosk = args?.kiosk;
      }
      config.windows.default.x = args?.x || 0;
      config.windows.default.y = args?.y || 0;
      config.windows.default.display = args?.display;
      config.windows.default.width = args?.width;
      config.windows.default.height = args?.height;
      config.windows.default.alwaysOnTop = args.ontop;
      if (args?.whiteListDomain) {
        config.domainwhitelist = args?.whiteListDomain
      }
      config.sslexceptions = args?.ssl;
      console.log(config);
    }
    else {
      console.log('Invalid');
      process.exit(1);
    }
  }

  const { app } = require('electron');
  const {loadWindows} = require('./lib/window.js');
  const { setUpServer } = require('./lib/server');

  if (!config?.windows) {
    console.log('Error loading oakWindows config')
    process.exit(1)
  }

  if (config?.server) {
    setUpServer(config);
  }

  app.whenReady().then(() => {
    let filePrefix = os.platform() == 'win32' ? '' : 'file://'
    
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    
    for (let key in config.windows) {
      if (config.windows[key] && config.windows[key].hasOwnProperty('url')) {
        config.windows[key].url = config.windows[key].url.startsWith("http") ? config.windows[key].url : filePrefix + path.join(__dirname, config.windows[key].url)
      }
      else {
        // window has been removed by setting to false
        delete (config.windows[key])
      }
    }
    // if (config.has('extrawaitforurls')) {
    //   for (var key in config.extrawaitforurls) {
    //     if (config.extrawaitforurls[key].hasOwnProperty('url')) {
    //       waitFor.push(config.extrawaitforurls[key].url)
    //     }
    //   }
    // }

    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      let { hostname } = new URL(url)
      console.log(config?.sslexceptions);
      let isTrusted = false
      if (config?.sslexceptions?.filter( pat => minimatch(hostname, pat))) {
        event.preventDefault();
        isTrusted = true
      }
      callback(isTrusted);
    });

    if (config?.waitforurls && config.waitforurls) {
      /*
       * Get a list of URI's needed for all the windows and use wait-for to wait
       * until they are all available. eg. wait for a local apache instance to load.
       */
      let waitFor = [] //= config.windows.map(value => value.url)
      for (var key in config.windows) {
        waitFor.push(config.windows[key].url)
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
}