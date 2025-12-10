const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

const isDev = process.env.NODE_ENV !== 'production';
const port = 3000;
let serverProcess = null;

function waitForServer(port, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const client = net.createConnection({ port }, () => {
        client.end();
        resolve();
      });
      client.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error('Server timeout'));
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npm', ['run', 'start'], { shell: true, stdio: 'inherit' });
    serverProcess.on('error', reject);
    waitForServer(port).then(resolve).catch(reject);
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
    icon: path.join(__dirname, 'public', 'logosta.jpg'),
    title: 'STA - Gestion de Stock',
  });

  mainWindow.loadURL(`http://localhost:${port}`);
  if (isDev) mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  if (isDev) {
    // En dev, lancer npm run dev si tu veux
    console.log('Mode dev : s’attend à ce que le serveur Next.js soit déjà lancé.');
  } else {
    console.log('Production : démarrage du serveur Next.js...');
    await startNextServer();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
