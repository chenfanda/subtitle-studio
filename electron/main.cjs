const { app, BrowserWindow, session, shell, ipcMain ,protocol,nativeImage} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs'); 
const { scanMediaDirectory } = require('./mediaScanner.cjs');


const AVATAR_DIR = path.join(app.getPath('userData'), 'avatars');
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

function createWindow() {

  const iconPath = isDev
  ? path.join(__dirname, '../public/default-avatar.png') 
  : path.join(__dirname, '../dist/default-avatar.png');
  let appIcon = nativeImage.createFromPath(iconPath);
  appIcon = appIcon.resize({ width: 512, height: 512, quality: 'better' });
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true, 
    title: "AI Subtitle Studio", 
    backgroundColor: '#1e1e24', 
    titleBarStyle: 'hidden', 
    icon: appIcon, 
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true,
      webSecurity: true, 
      
      preload: path.join(__dirname, 'preload.cjs'), 
    },
  });
  win.setMenu(null);

    // 最小化
  ipcMain.on('window-minimize', () => {
    win.minimize();
  });

  // 最大化/还原
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  // 关闭
  ipcMain.on('window-close', () => {
    win.close();
  });
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startURL);

  // if (isDev) {
  //   win.webContents.openDevTools();
  // }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' }; 
    }
    return { action: 'allow' };
  });
}

  protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'safe-file', 
    privileges: { 
      standard: true, 
      secure: true, 
      supportFetchAPI: true, 
      bypassCSP: true,  
      corsEnabled: true 
    } 
  }
]);
app.whenReady().then(() => {
  protocol.registerFileProtocol('safe-file', (request, callback) => {
    const url = request.url.replace('safe-file://', '');
    try {
      const decodedUrl = decodeURIComponent(url);

      return callback(decodedUrl);
    } catch (error) {
      console.error('Failed to register protocol', error);
    }
  });

  ipcMain.handle('save-avatar', async (_event, arrayBuffer, fileName) => {
    try {
      const buffer = Buffer.from(arrayBuffer);
  
      const uniqueFileName = `${Date.now()}-${fileName}`;
      const filePath = path.join(AVATAR_DIR, uniqueFileName);
      
      await fs.promises.writeFile(filePath, buffer);
      
      return `safe-file://${filePath}`;
    } catch (error) {
      console.error('Save avatar failed:', error);
      throw error;
    }
  });
  
  ipcMain.handle('get-preset-media', async () => {
    
    const rootPath = isDev ? process.cwd() : app.getAppPath();
    const mediaPath = isDev 
      ? path.join(rootPath, 'public/assets/media') 
      : path.join(process.resourcesPath, 'app/dist/assets/media');

    console.log('Scanning directory:', mediaPath); 
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