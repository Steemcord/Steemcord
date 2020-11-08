import { app } from 'electron';
import { join } from 'path';

export const VERSION = app.getVersion();
export const APP_USER_MODEL_ID = 'Snazzah.Steemcord';
export const MAIN_APP_URL = join('file://', __dirname, './view/index.html');
export const GUARD_APP_URL = join('file://', __dirname, './view/guard/index.html');
export const MAIN_DIRECTORY_POINT = 'https://snaz.in/steemcord/dpoint';
export const STEEMCORD_CLIENT_ID = '773371054440972289';
