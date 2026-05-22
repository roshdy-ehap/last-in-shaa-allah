'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform:   process.platform,
  arch:       process.arch,
  saveDB:      data           => ipcRenderer.invoke('db:save',    data),
  loadDB:      ()             => ipcRenderer.invoke('db:load'),
  saveDialog:  (name, data)   => ipcRenderer.invoke('dialog:save', name, data),
  openDialog:  ()             => ipcRenderer.invoke('dialog:open'),
  autoBackup:  data           => ipcRenderer.invoke('backup:auto', data),
  appInfo:     ()             => ipcRenderer.invoke('app:info'),
  minimize:    ()             => ipcRenderer.send('win:minimize'),
  maximize:    ()             => ipcRenderer.send('win:maximize'),
  close:       ()             => ipcRenderer.send('win:close'),
});
