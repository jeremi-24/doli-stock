const { contextBridge } = require('electron');

// La 'contextBridge' est le moyen le plus sûr d'exposer des API
// du processus principal d'Electron au processus de rendu (votre application Next.js).
// Pour l'instant, nous ne créons pas d'API spécifique, mais la structure est en place.
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemple de fonction que vous pourriez vouloir exposer à l'avenir :
  // getAppName: () => ipcRenderer.invoke('get-app-name')
});
