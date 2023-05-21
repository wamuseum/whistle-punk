# Whistle Punk

This is a powerfull launcher for HTML based interactive screens or kiosks.
Inspired by oak (https://www.npmjs.com/package/oak).

#### Whistle Punk definition
> a lumberjack who operates the signal wire running to a donkey engine whistle

Sounds a bit like someone who keeps an eye on things and makes sure they don't get out of hand...

## Features:

- Works cross platform, windows, linux and osx but predominantly tested on linux.
- Blocks opening new windows/tabs.
- Whitelists URLs so that you cannot reach unwanted sites.
- Whitelists domains to allow for self signed ssl certs.
- Waits for all listed URLs to become available before opening them. 
Useful if you need to wait for a local web sever to startup before launching,
or for low performing wifi. This can prevent an error page if your computer is
slow to initialise and find the network.
- If the loaded web pages crash or become unresponsive, Whistle Punk will attempt
to recover by reloading the page or killing and reopening the window.
**you can disable this in a window by including "crashprevention: false".**
- Allows multiple windows to be opened across all local displays.
  - Window size and other attributes can be individually configured.
- Listens for commands on port 8000 by default, commands include:
  - /reset (Reset all windows to their original URL and force a reload)
  - /reload (Same as above but with a call to electron's cacheClear)
  - These can be invoked by ```curl http://localhost/reload```
- Flexible solution for logging, currently we log to syslog and ship them to our
central log store using filebeat https://www.elastic.co/beats/filebeat
  - eg. log console.log messages:
  ```oak --autoplay-policy=no-user-gesture-required ./index.js | logger -p user.info -t OAK &```
- Arbitrary scripts can be injected into the windows. Example for injecting
jquery and an onscreen keyboard are given in config/default-dist.yml
- Takes configuration from a yaml file, commandline arguments or a custom
javascript file with electron available
  
## Usage
### Quickstart
1. git checkout this repo or download and extract to a folder.
2. ```cd whistle-punk```
3. ```npm install```
4. ```npm run start``` should get you an example window (configured in config/default-dist.yml).

This is a shortcut to using a yaml file for the configuration options.

### Commandline
Installed globally, or locally (as a dev dependency of another project) with npm the
command whistle-punk will be available.

```shell
$ whistle-punk --help
whistle-punk [options] URI

Options:
      --version     Show version number  [boolean]
  -d, --de-bug      Output debug information to stdout  [boolean] [default: false]
      --display     Display ID to open window on  [default: 0]
  -f, --fullscreen  Fullscreen?  [boolean] [default: true]
  -h, --height      Height of the window in pixels
  -k, --kiosk       Kiosk mode?  [boolean] [default: true]
  -t, --ontop       Start window on top of others  [boolean] [default: true]
      --ssl  [string]
  -v, --verbose     Verbose output  [boolean] [default: false]
  -w, --width       Width of the window in pixels
  -x                Window Position x
  -y                Window Position y
      --help        Show help  [boolean]

Examples:
  whistle-punk --kiosk=false --width=1920 --height=1080 https://visit.museum.wa.gov.au/
  whistle-punk config.yml
```

If you've checked out this repo, whistle-punk can be tested with ```npm run start```
or the equivalent command ```./bin/entrypoint --kiosk=false --width=1920 --height=1080 https://visit.museum.wa.gov.au/```

#### URI: Yaml file

Duplicate the window entry for multiple windows and set the display to "0", "1", "2", "3" etc.
depending on how many you have plugged in.

##### config/default-dist.yml
```yaml
sslexceptions:
  - 'localhost'
  - '*.local'
domainwhitelist:
  - test.local
flags:
  ignore-gpu-blacklist:
    flag: 'ignore-gpu-blacklist'
  enable-native-gpu-memory-buffers:
    flag: 'enable-native-gpu-memory-buffers'
  enable-gpu-rasterization:
    flag: 'enable-gpu-rasterization'
shortcut:
  reload: false
  quit: false
server:
  host: 'localhost'
  port: 8000
waitforurls: true
extrawaitforurls:
  visit:
    url: 'https://visit.museum.wa.gov.au'
injectcss: # css injected into all windows
  simpleKeyboard:
    path: 'node_modules/simple-keyboard/build/css/index.css'
injectscripts: # scripts injected into all windows
  jquery:
    name: '$'
    path: 'node_modules/jquery/dist/jquery.min.js'
  simpleKeyboard:
    name: simpleKeyboard
    path: 'node_modules/simple-keyboard/build/index.js'
  simpleKeyboardLayouts:
    name: simpleKeyboardLayouts
    path: 'node_modules/simple-keyboard-layouts/build/index.js'
  keyboard:
    path: 'inject-scripts/keyboard.js'
windows:
  default:
    display: 0
    url: './index.html'
    title: 'Whistle Punk'
    background: '#ffffff'
    ontop: false
    insecure: false
    kiosk: false
    fullscreen: false
    frame: true
    width: 500
    height: 500
    x: 50
    y: 50
    node: false
    injectscripts: # add additional scripts only injected into this window
      usejquery:
        path: 'inject-scripts/usejquery.js'
```

### Bring your own javascript launcher
You can also specify your own javascript file on the commandline instead of a yaml file or URL.

```whistle-punk /home/andrew/main.js```

will be the equivalent of ```electron /home/andrew/main.js``` with app and BrowserWindow etc.
available to you.

#### main.js
```javascript
const { app, BrowserWindow } = require('electron')
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})
```
