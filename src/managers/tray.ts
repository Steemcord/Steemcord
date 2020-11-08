import { Menu, Tray, app, shell } from 'electron';
import { join } from 'path';
import { win, trayManager } from '..';
import { platform } from 'os';
import { updateAvailable, updater } from './update';

let trayIcon;

switch (platform()) {
  case 'darwin':
    trayIcon = join(__dirname, '../assets/icon.png');
    break;
  case 'win32':
    trayIcon = join(__dirname, '../assets/icon.ico');
    break;
  default:
    trayIcon = join(__dirname, '../assets/icon@4x.png');
    break;
}

export class TrayManager {
  tray: Tray;

  constructor() {
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip(app.name);
    this.tray.on('right-click', () => this.update());
    this.tray.on('click', () => win.show());
  }

  update(): void {
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          icon:
            platform() === 'darwin'
              ? join(__dirname, '../assets/icon.png')
              : join(__dirname, '../assets/icon@4x.png'),
          label: `${app.name} v${app.getVersion()}`,
          click: () => win.show()
        },
        {
          label: `Update ${app.name} to ${updateAvailable}`,
          visible: !!updateAvailable,
          click: () => updater.quitAndInstall(true, true)
        },
        {
          label: 'Check for Updates...',
          click: () => updater.checkForUpdatesAndNotify(),
          visible: !updateAvailable
        },
        {
          type: 'separator'
        },
				{
					label: 'GitHub Repo',
					click: () => shell.openExternal('https://github.com/Steemcord/Steemcord')
				},
        {
          type: 'separator'
        },
        {
          label: `Quit ${app.name}`,
          role: 'quit'
        }
      ])
    );
  }
}

app.once('quit', () => trayManager.tray.destroy());