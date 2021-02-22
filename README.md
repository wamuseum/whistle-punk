# Whistle Punk

This is a generic launcher for HTML based interactive screens or kiosks.

We use electron via oak (https://www.npmjs.com/package/oak) for our HTML based Gallery screens, so we thought it would be appropriate
to go with a tree/forrest/lubberjack theme, hence Whistle Punk:

> a lumberjack who operates the signal wire running to a donkey engine whistle

Sounds a bit like someone who keeps an eye on things...

### Features:

- Works cross platform, windows, linux and osx but predominantly tested on linux.
- x86 and rpi but currently only actively tested on x86.  
- Allows multiple windows to be open across all local displays.
    - Window size and other attributes can be individually configured.
- If the loaded web pages crash or become unresponsive, Whistle Punk will attempt to recover by reloading the page or killing and reopening the window.
- Arbitrary scripts can be injected into the windows. An example is included to hide the cursor for touch based kiosks where the source page does not and cannot have that feature added.
- Takes configuration from yaml files using https://www.npmjs.com/package/config.
    - We write overrides in config/local.yml with puppet so that we can configure and manage all our screens centrally.
  
### Usage

```npm start``` should get you a window that tests unresponsive and crashed pages.

To load your own URLs, copy src/default.yml to src/local.yml and adapt.

Duplicate the window entry for multiple windows and set the display to "0", "1", "2", "3" etc. depending on how many you have plugged in. This structure matches the oak.load parameters: https://www.npmjs.com/package/oak#oakloadoptions-callback

#### Example config/local.yml
```yaml
windows:
  - display: 0
    url: './index.html'
    title: 'OAK'
    background: '#ffffff'
    ontop: false
    insecure: false
    kiosk: false
    fullscreen: false
    frame: true
    size: '1024x500'
    x: 50
    y: 50
    node: true
  - display: 0
    url: 'https://museum.wa.gov.au/'
    title: 'OAK'
    background: '#ffffff'
    ontop: false
    insecure: false
    kiosk: false
    fullscreen: false
    frame: false
    size: '1024x500'
    x: 100
    y: 100
    node: false
    scripts:
      - 'hide-cursor.js'
```