const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  // 1. 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "AI Subtitle Studio", // 你的应用标题
    webPreferences: {
      // 安全设置：
      // nodeIntegration: false 意味着前端 React 代码不能直接 require('fs')，
      // 必须通过 preload.js 通信（这是 Electron 安全最佳实践）。
      // 由于你的项目主要是 Web 逻辑调用 HTTP 接口，这里保持 false 即可。
      nodeIntegration: false, 
      contextIsolation: true,
      webSecurity: true, // 保持开启，除非遇到极难解决的 CORS 问题
    },
  });

  // 2. 加载页面逻辑
  // 开发环境：加载 localhost:3000 (对应你 vite.config.ts 的端口)
  // 生产环境：加载打包后的 dist/index.html
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startURL);

  // 3. 开发工具
  // 如果是开发环境，自动打开控制台(F12)
  if (isDev) {
    win.webContents.openDevTools();
  }

  // 4. 处理外部链接
  // 你的应用里可能有 "查看详情" 或 "下载" 链接。
  // 默认情况下 Electron 会在当前窗口打开，导致 React 应用被覆盖。
  // 这段代码强制所有 http/https 链接调用系统默认浏览器打开。
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' }; // 阻止在 Electron 内部打开
    }
    return { action: 'allow' };
  });
}

// App 准备就绪后的生命周期
app.whenReady().then(() => {
  
  // 【关键配置】针对 FFmpeg 的 SharedArrayBuffer 支持
  // Vite 开发服务器里配置了 headers，但在 Electron 生产环境(file协议)里没有服务器。
  // 我们必须拦截请求，手动注入 COOP 和 COEP 头，否则 ffmpeg 会报错无法运行。
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

// 关闭所有窗口时退出应用 (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});