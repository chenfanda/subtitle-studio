const { app, BrowserWindow, session, shell, ipcMain } = require('electron'); // 1. 确保引入了 ipcMain
const path = require('path');
const isDev = require('electron-is-dev');
const { scanMediaDirectory } = require('./mediaScanner.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "AI Subtitle Studio", 
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true,
      webSecurity: true, 
      // 2. 【关键修正】必须注册 preload 脚本，否则桥梁不通
      preload: path.join(__dirname, 'preload.cjs'), 
    },
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startURL);

  if (isDev) {
    win.webContents.openDevTools();
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' }; 
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  // 3. 【关键修正】IPC 监听必须在 appReady 时建立
  ipcMain.handle('get-preset-media', async () => {
    // 使用 app.getAppPath() 更加稳健
    const rootPath = isDev ? process.cwd() : app.getAppPath();
    const mediaPath = isDev 
      ? path.join(rootPath, 'public/assets/media') 
      : path.join(process.resourcesPath, 'app/dist/assets/media');

    console.log('Scanning directory:', mediaPath); // 调试信息
    return scanMediaDirectory(mediaPath);
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});