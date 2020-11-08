import loggr from '../logger';
const logger = loggr('updater');

import { autoUpdater } from 'electron-updater';
import EventEmitter from 'eventemitter3';

export let updateAvailable: string = null;
export const emitter = new EventEmitter();
export const updater = autoUpdater;

export function start(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const log = require('electron-log');
  log.transports.file.level = 'debug';
  autoUpdater.logger = log;
  autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on('error', e => logger.error(e));
autoUpdater.on('checking-for-update', () => logger.log('checking for update'));
autoUpdater.on('update-not-available', () => logger.log('update not available'));
autoUpdater.on('update-downloaded', () => logger.log('update downloaded'));
autoUpdater.on('update-available', info => {
  logger.log('update available:', info.version);
  updateAvailable = info.version;
  emitter.emit('update', info.version);
});