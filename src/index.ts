import loggr from './logger';
const logger = loggr('app');

import { app, BrowserWindow, dialog } from 'electron';
import { update as initAutoLaunch } from './managers/launch';
import { platform } from 'os';
import { join } from 'path';
import { TrayManager } from './managers/tray';
import { settings } from './managers/settings';
import { start as initPresences, startUpdateInterval } from './managers/presence';
import { start as initUpdater } from './managers/update';
import { autoLogin } from './steam';
import { APP_USER_MODEL_ID, MAIN_APP_URL } from './constants';
import fs from 'fs';

export let trayManager: TrayManager;
export let win: BrowserWindow;
export const updateCheckerInterval = null;
export const VERSION = app.getVersion();

if (!app.requestSingleInstanceLock())
  app.quit();

app.setAppUserModelId(APP_USER_MODEL_ID);
app.whenReady().then(async () => {
	trayManager = new TrayManager();

	await Promise.all([initUpdater(), initAutoLaunch(), autoLogin(), initPresences(), startUpdateInterval()]);

  /*
	app.isPackaged
		? (updateCheckerInterval = setInterval(checkForUpdate, 15 * 1000 * 60))
		: undefined;
  */
  if (platform() === 'darwin') app.dock.hide();
  
  // Prepare presence folder
  const presenceFolder = join(app.getPath('userData'), 'presences');
  fs.access(join(app.getPath('userData'), 'presences'), fs.constants.F_OK, err => {
    if(err) fs.mkdirSync(presenceFolder);
  });
	
	win = new BrowserWindow({
    width: settings.get('window.width', 900) as number,
    height: settings.get('window.height', 600) as number,
    x: settings.get('window.x', null) as number,
    y: settings.get('window.y', null) as number,
    frame: false,
    title: 'Steemcord',
    icon: join(__dirname, './assets/icon.ico'),
    minHeight: 600,
    minWidth: 900,
    resizable: true,
    show: false,
    darkTheme: true,
    backgroundColor: '#25282e',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  win.on('close', () => {
    logger.info('Saving window location');
    settings.set('window.width', win.getSize()[0]);
    settings.set('window.height', win.getSize()[1]);
    settings.set('window.x', win.getPosition()[0]);
    settings.set('window.y', win.getPosition()[1]);
  });

  win.on('closed', () => {
    logger.info('Killing app');
    win = null;
    app.quit();
  });

  win.on('unresponsive', async () => {
    logger.info('Detected unresponsiveness');
    const dialogResult = await dialog.showMessageBox(null, {
      type: 'warning',
      title: 'Page Unresponsive',
      message: 'This window is not being responsive.',
      buttons: ['Reload', 'Close', 'Ignore']
    });
    if(dialogResult.response === 0) win.reload();
      else if(dialogResult.response === 1) win.close();
  });

  win.loadURL(MAIN_APP_URL);
  logger.info('Ready');

  if (settings.get('showWindowOnLaunch', true))
    win.once('ready-to-show', () => win.show());
});