const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (the webpage)
contextBridge.exposeInMainWorld('electronAPI', {
  saveGcode: (gcodeContent) => ipcRenderer.invoke('save-gcode', gcodeContent),
});


// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
