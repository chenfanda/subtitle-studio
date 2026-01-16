const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPresetMedia: () => ipcRenderer.invoke('get-preset-media'),
  saveAvatar: (buffer, fileName) => ipcRenderer.invoke('save-avatar', buffer, fileName),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});