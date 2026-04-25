// Electron 預載腳本 — 透過 contextBridge 暴露安全的檔案操作 API
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** 另存新檔：彈出系統對話框 */
  saveFile: (content, defaultName, filters) =>
    ipcRenderer.invoke('file:save', { content, defaultName, filters }),

  /** 開啟檔案：彈出系統對話框，回傳檔案內容字串或 null */
  openFile: (filters) =>
    ipcRenderer.invoke('file:open', { filters }),
});
