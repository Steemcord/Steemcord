import loggr from '../logger';
const logger = loggr('autolaunch');

import AutoLaunch from 'auto-launch';
import { app } from 'electron';
import { settings } from './settings';

const autoLaunch = new AutoLaunch({
	name: app.name,
	isHidden: true
});

export async function update(): Promise<void> {
	if (!app.isPackaged)
		return logger.info('Skipping');
	if (settings.get('autoLaunch', true))
		autoLaunch.enable();
	else autoLaunch.disable();
}