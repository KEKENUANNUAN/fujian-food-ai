const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');

// 判断是否为开发模式
const isDev = !app.isPackaged;

let mainWindow = null;
let serverProcess = null;

function startServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // 开发模式：用 tsx 运行 TypeScript 源码
      const serverPath = path.join(__dirname, '..', 'server', 'index.ts');
      serverProcess = spawn('npx', ['tsx', serverPath], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        env: { ...process.env, PORT: '3000' }
      });
    } else {
      // 生产模式：fork 编译后的 CommonJS 服务端
      const serverPath = path.join(__dirname, '..', 'server-dist', 'index.js');
      const dbPath = path.join(app.getPath('userData'), 'chat.db');
      const dotenvPath = path.join(process.resourcesPath, '.env');
      const staticDir = path.join(__dirname, '..', 'dist');

      console.log('[Electron] Server paths:');
      console.log('  server:', serverPath);
      console.log('  db:', dbPath);
      console.log('  dotenv:', dotenvPath);
      console.log('  static:', staticDir);

      serverProcess = fork(serverPath, [], {
        stdio: 'pipe',
        env: {
          ...process.env,
          PORT: '3000',
          DB_PATH: dbPath,
          DOTENV_PATH: dotenvPath,
          STATIC_DIR: staticDir,
        }
      });
    }

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output.trim());
      // 检测服务器启动成功
      if (output.includes('服务器已启动') || output.includes('listening') || output.includes('started')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('[Server] Failed to start:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`[Server] Process exited with code ${code}`);
      serverProcess = null;
    });

    // 5秒后超时，假设服务器已启动
    setTimeout(resolve, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '福建非遗美食助手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产模式：加载后端服务的页面（Express 同时提供静态文件和 API）
    mainWindow.loadURL('http://localhost:3000');
  }

  // 在外部浏览器中打开链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
    console.log('[Electron] Server started successfully');
  } catch (err) {
    console.error('[Electron] Failed to start server:', err);
    // 即使服务器启动失败也创建窗口，让用户看到错误信息
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
