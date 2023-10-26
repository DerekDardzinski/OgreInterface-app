const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {spawn} = require("child_process")
const kill = require('tree-kill');
var portfinder = require('portfinder');
// var deasync = require('deasync');
// import getPort, {portNumbers} from "get-port";
// var syncPort = deasync(getPort)

let pythonServerKilled = false;
let pythonServer;
// void async function () {
//   const port = await getPort({port: portNumbers(3001, 3999)});
// }();
// const port = syncPort({port: portNumbers(3001, 3999)});
// const port = 3001
portfinder.setBasePort(3001);    // default: 8000
portfinder.setHighestPort(3999); // default: 65535
portfinder.getPort(function (err, port) {
console.log(port)
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  if (app.isPackaged) {
    const runFlask = {
      darwin: `${path.join(process.resourcesPath, "app", "app")}`,
      linux: `${path.join(process.resourcesPath, "app", "app")}`,
      win32: `start ${path.join(process.resourcesPath, "app", "app.exe")}`,
    }[process.platform];
  
    pythonServer = spawn(`${runFlask} ${port}`, { detached: false, shell: true, stdio: 'pipe' });
  } else {
    pythonServer = spawn(`python app.py ${port}`, { detached: true, shell: true, stdio: 'inherit' });
  }

  ipcMain.on('get-port-number', (event, _arg) => {
    event.returnValue = port;
  });
  // ipcMain.on('get-preload-path', (event, _arg) => {
  //   event.returnValue = preloadPath;
  // });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on("before-quit", (event) => {
  if (!pythonServerKilled) {
    event.preventDefault();
    console.log("KILLING SERVER!")
    kill(pythonServer.pid, () => {
      pythonServerKilled = true;
      app.quit();
    });
    // pythonServerKilled = true;
    // app.quit();
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
});