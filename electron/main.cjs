// Electron 主進程 — 含錯誤處理、日誌記錄、啟動失敗 fallback
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// === 日誌記錄機制 ===
// 位置：app.getPath('userData')/logs/error.log
// 超過 5MB 輪替為 error.log.old
function getLogPath() {
  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, 'error.log');
}

function writeLog(type, message, stack) {
  try {
    const logPath = getLogPath();
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    // 輪替檢查
    if (fs.existsSync(logPath)) {
      const stat = fs.statSync(logPath);
      if (stat.size >= MAX_SIZE) {
        const oldPath = logPath + '.old';
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        fs.renameSync(logPath, oldPath);
      }
    }

    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${type}] ${message}${stack ? '\n' + stack : ''}\n`;
    fs.appendFileSync(logPath, entry, 'utf-8');
  } catch (_) {
    // 日誌寫入失敗時不應影響主程式
  }
}

// === IPC 錯誤訊息對應 ===
function getErrorMessage(err) {
  if (err.code === 'EBUSY') {
    return '檔案正被其他程式使用中，請關閉相關程式後再試一次。';
  }
  if (err.code === 'EPERM' || err.code === 'EACCES') {
    return '沒有檔案寫入權限，請確認檔案未被設為唯讀。';
  }
  writeLog('ERROR', `IPC 操作失敗: ${err.message}`, err.stack);
  return '操作失敗，請稍後再試。';
}

// === 渲染進程崩潰計數 ===
let crashCount = 0;
let crashTimer = null;

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

  // 啟動失敗 fallback：載入失敗時顯示 error.html
  mainWindow.webContents.on('did-fail-load', () => {
    writeLog('ERROR', '主頁面載入失敗，切換至 error.html');
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // 渲染進程崩潰處理：60 秒內超過 3 次才退出
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeLog('ERROR', `渲染進程崩潰: ${details.reason}`, null);

    crashCount++;
    if (!crashTimer) {
      crashTimer = setTimeout(() => {
        crashCount = 0;
        crashTimer = null;
      }, 60000);
    }

    if (crashCount >= 3) {
      dialog.showErrorBox('應用程式錯誤', '應用程式畫面多次崩潰，請重新啟動應用程式。');
      app.exit(1);
    } else {
      mainWindow.reload();
    }
  });

  // 開發模式讀 localhost，正式模式讀 dist/index.html
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// === 全域錯誤捕獲 ===
process.on('uncaughtException', (err) => {
  writeLog('FATAL', `uncaughtException: ${err.message}`, err.stack);
  dialog.showErrorBox('應用程式錯誤', '應用程式發生錯誤，請重新啟動。如持續發生，請將日誌檔提供給開發團隊。');
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : null;
  writeLog('FATAL', `unhandledRejection: ${msg}`, stack);
  dialog.showErrorBox('應用程式錯誤', '應用程式發生錯誤，請重新啟動。如持續發生，請將日誌檔提供給開發團隊。');
  app.exit(1);
});

// === IPC 檔案操作（含錯誤處理）===

// 另存新檔
ipcMain.handle('file:save', async (_event, { content, defaultName, filters }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    if (result.canceled || !result.filePath) return false;
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return true;
  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
});

// 開啟檔案
ipcMain.handle('file:open', async (_event, { filters }) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return fs.readFileSync(result.filePaths[0], 'utf-8');
  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
});
