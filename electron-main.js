
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

const isDev = process.env.NODE_ENV !== 'production';
const appUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../out/index.html')}`;

function createWindow() {
  // Créer la fenêtre du navigateur.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
    icon: path.join(__dirname, 'public', 'logosta.jpg'),
    title: "STA - Gestion de Stock",
  });

  // Charger l'application Next.js.
  mainWindow.loadURL(appUrl);

  // Ouvrir les DevTools si en mode développement.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigation.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Sur macOS, il est courant de recréer une fenêtre dans l'application quand
    // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres d'ouvertes.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
