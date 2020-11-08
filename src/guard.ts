import loggr from './logger';
const logger = loggr('guard');

import { ipcMain, BrowserWindow } from 'electron';
import { GUARD_APP_URL } from './constants';
import { win as parentWin } from './';
import { join } from 'path';

export let win: BrowserWindow;

export async function prompt(domain: string | null, failedBefore: boolean): Promise<string|null> {
  return new Promise(resolve => {
    if (win) return;
    logger.info(`Starting guard (domain=${domain}, failedBefore=${failedBefore})`);

    let completed = false;

    win = new BrowserWindow({
      parent: parentWin,
      modal: true,
      height: 300,
      width: 600,
      frame: false,
      show: false,
      title: 'Steemcord Guard',
      icon: join(__dirname, './assets/icon.ico'),
      resizable: false,
      backgroundColor: '#25282e',
      darkTheme: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    });
  
    win.loadURL(GUARD_APP_URL);
  
    win.once('ready-to-show', () => {
      win.show();
      win.setMenu(null);
    });
  
    ipcMain.once('guard-callback', (_, code: string | null) => {
      if (completed) return;
      completed = true;
      logger.info(`Returned ${code}`);
      win.close();
      win = null;
      resolve(code ? code.toLowerCase() : null);
    });
  
    ipcMain.once('guard-ready', () => {
      logger.info('Ready');
      win.webContents.send('guard-init', { domain, failedBefore });
    });
  
    win.on('closed', () => {
      if (completed) return;
      completed = true;
      win = null;
      resolve(null);
    });
  });
}

export function killPrompt(): void {
  if (!win) return;
  win.close();
}