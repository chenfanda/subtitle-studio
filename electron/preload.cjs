const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPresetMedia: () => ipcRenderer.invoke('get-preset-media')
});