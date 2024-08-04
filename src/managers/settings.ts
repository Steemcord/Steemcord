import ElectronStore from 'electron-store';
import { update as updateAutoLaunch } from './launch';

export const settings = new ElectronStore({});

export interface ExtensionSettings {
	enabled: boolean;
	autoLaunch: boolean;
	devMode: boolean;
	language: string;
	windowPosition: {
		x: number;
		y: number;
		width: number;
		height: number;
		maximized: boolean;
	}
}

export function update(): void {
	updateAutoLaunch();
}