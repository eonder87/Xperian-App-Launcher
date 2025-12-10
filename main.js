const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// Fix for "Access Denied" cache errors on Windows
// We set a specific path for user data that we know we can write to.
const userDataPath = path.join(app.getPath('appData'), 'AntigravityLauncher');
app.setPath('userData', userDataPath);

// AGGRESSIVELY Disable Caches to stop permission errors
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
app.commandLine.appendSwitch('disable-code-cache');
app.commandLine.appendSwitch('disable-software-rasterizer'); // Sometimes helps with GPU lockups



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
    // If running as portable app, the original exe location is stored in this env var
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        return process.env.PORTABLE_EXECUTABLE_DIR;
    }
    // If packaged (installed/unpacked), use the executable's directory.
    // If dev, use the project source directory (__dirname).
    return app.isPackaged ? path.dirname(process.execPath) : __dirname;
});
