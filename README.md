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