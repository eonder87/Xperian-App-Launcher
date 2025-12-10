const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: true, // Start in fullscreen for kiosk mode
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Enabling this for easier prototyping
        },
        frame: false, // Remove window frame for full immersion
        backgroundColor: '#000000'
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools(); 
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Handle app launching
ipcMain.on('launch-app', (event, appPath) => {
    console.log(`Attempting to launch: ${appPath}`);

    if (!appPath) return;

    // Execute the external application
    // Using exec is simple but spawn might be better for long running processes.
    // We use the start command on windows to detach it somewhat or just run it.
    // Actually, exec with the path is usually enough for .exe
    exec(`"${appPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error launching app: ${error}`);
            // Ideally send feedback to renderer
            return;
        }
        console.log(`Launched ${appPath}`);
    });
});

// Handle generic quit
// Handle generic quit
ipcMain.on('quit-app', () => {
    app.quit();
});

// Provide the correct root path for external files (apps/assets)
ipcMain.handle('get-base-path', () => {
    // If packaged (exe), use the executable's directory.
    // If dev, use the project source directory (__dirname).
    return app.isPackaged ? path.dirname(process.execPath) : __dirname;
});
