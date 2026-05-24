const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load the web app hosted by our local express server
  mainWindow.loadURL('http://127.0.0.1:3000');

  // mainWindow.webContents.openDevTools();
}

function startServer() {
  // Start the server
  let serverProcessCommand = 'npx';
  let serverProcessArgs = ['tsx', path.join(__dirname, '..', 'server.ts')];

  if (app.isPackaged) {
    serverProcessCommand = 'node';
    serverProcessArgs = [path.join(__dirname, '..', 'dist', 'server.js')];
  }

  serverProcess = spawn(serverProcessCommand, serverProcessArgs, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: app.isPackaged ? 'production' : 'development', ELECTRON_ENV: 'true' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString()}`);
  });
}

app.whenReady().then(() => {
  startServer();
  
  // Give server a bit of time to start before creating window
  setTimeout(createWindow, 2000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
