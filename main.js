const { app, BrowserWindow } = require('electron');
require('dotenv').config();
const path = require('path');
const api = require('./Componets/api');
const { watchFolder, readBlacklist, getHour, getTodayFolder, readImageAsBase64 } = require('./Componets/watcher');

function createWindow() {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      }
    });
  
    win.loadFile('index.html');
    startMonitoring();
  }
  
  async function startMonitoring() {
    const blacklistFile = process.env.APP_RUTE_BLACKLISTFILE;
    const blacklist = await readBlacklist(blacklistFile);
  
    let currentFolder = path.join(process.env.APP_RUTE_MATRICULASFOLDER, getTodayFolder());
    console.log(`Monitoreando la carpeta ${currentFolder}`);
    let watcher = watchFolder(currentFolder, blacklist);
  
    setInterval(() => {
      const newFolder = path.join(process.env.APP_RUTE_MATRICULASFOLDER, getTodayFolder());
      if (newFolder !== currentFolder) {
        console.log(`Cambio de día detectado. Nueva carpeta: ${newFolder}`);
        watcher.close();
        currentFolder = newFolder;
        watcher = watchFolder(currentFolder, blacklist);
      }
    }, 1000 * 60);
  }
  
  app.whenReady().then(createWindow);
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  