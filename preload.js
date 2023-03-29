// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// require('./hide-cursor');
// window.wam = require('./inject_scripts/activity-detector');

contextBridge.exposeInMainWorld('whistlePunk', {
  send(message) {
    return ipcRenderer.sendSync('_window', message);
  },
  handleMessage: (callback) => ipcRenderer.on('_window', callback)
});
