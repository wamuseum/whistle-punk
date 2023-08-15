// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');
const forEach = require('lodash.foreach');

contextBridge.exposeInMainWorld('whistlePunk', {
  send(message) {
    return ipcRenderer.sendSync('_window', message);
  },
  handleMessage: (callback) => ipcRenderer.on('_window', callback)
});

ipcRenderer.once('_scriptsToInject', (event, scripts) => {
  forEach(scripts, (value, index) => {
    if (value?.name && value?.path) {
      window[value.name] = require(value.path);
    } else if (typeof value.path === 'string') {
      require(value.path);
    }
  });
})