// Electron 主進程
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'AWP 配置產生器',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 簡化選單
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '檔案', submenu: [{ role: 'quit', label: '結束' }] },
    { label: '檢視', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }] },
  ]));

  // 開發模式讀 localhost，正式模式讀 dist/index.html
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// === IPC 檔案操作 ===

// 另存新檔
ipcMain.handle('file:save', async (_event, { content, defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (result.canceled || !result.filePath) return false;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return true;
});

// 開啟檔案
ipcMain.handle('file:open', async (_event, { filters }) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return fs.readFileSync(result.filePaths[0], 'utf-8');
});
