// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');
const has = require('lodash.has');

contextBridge.exposeInMainWorld('whistlePunk', {
  send(message) {
    return ipcRenderer.sendSync('_window', message);
  },
  handleMessage: (callback) => ipcRenderer.on('_window', callback)
});

ipcRenderer.once('_scriptsToInject', (event, scripts) => {
  scripts.forEach(function (val) {
    if (has(val, 'name') && has(val, 'path')) {
      window[val.name] = require(val.path)
    } else if (typeof val === 'string') {
      console.log(val);
      require(val)
    }
  })
})