import Log from 'electron-log';
import { app, BrowserWindow, BrowserWindowConstructorOptions, screen } from 'electron';
import path from 'path';
import { isDev, isNightly } from './config';
import { setupDefault } from './Setups/setup';
import { appConfig } from './ElectronStore/Configuration';
import IpcMainEvents from './IpcMainEvents/IpcMainEvents';
import BibleModules from './Modules/Bible/Bible';
import AppUpdater from './AutoUpdate';
import { setupPortableMode } from './util/portable';
import { attachResizeListener } from './util/window';

// Check if running in portable mode
setupPortableMode();

async function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const appBounds: any = appConfig.get('setting.appBounds');

    let iconPath = path.join(__dirname, 'assets', 'icon.ico');

    if (isDev || isNightly) iconPath = path.join('assets', 'icon.ico');

    const BrowserWindowOptions: BrowserWindowConstructorOptions = {
        width: 1200,
        minWidth: 900,
        height: 750,
        minHeight: 600,
        icon: iconPath,
        webPreferences: {
            preload: __dirname + '/preload.js',
            devTools: isNightly,
        },
        show: false,
        alwaysOnTop: true,
        frame: false,
    };

    if (appBounds !== undefined && appBounds !== null) Object.assign(BrowserWindowOptions, appBounds);
    const mainWindow = new BrowserWindow(BrowserWindowOptions);


    attachResizeListener(mainWindow);

    // Ensure a single instance of the app
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        // Quit if another instance is already running
        app.quit();
    }

    // run ipcMain events before loading the window
    IpcMainEvents(mainWindow);

    // Modules
    BibleModules();

    // auto updated
    if (!isDev && !isNightly) AppUpdater(mainWindow);

    // and load the index.html of the app.
    // win.loadFile("index.html");
    await mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`);

    if (appBounds !== undefined && appBounds !== null && appBounds.width > width && appBounds.height > height)
        mainWindow.maximize();
    else mainWindow.show();

    // this will turn off always on top after opening the application
    setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
        mainWindow.focus();
    }, 1000);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    // check and set up the database
    try {
        await setupDefault
            .then((response) => console.log(response))
            .catch((e) => {
                console.log(e);
            });
    } catch (e) {
        Log.error(e);
        app.quit();
    }

    await createWindow();
    app.on('activate', function () {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
