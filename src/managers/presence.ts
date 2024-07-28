import { app, Notification } from 'electron';
import { join } from 'path';
import { settings } from './settings';
import EventEmitter from 'eventemitter3';
import { getPresenceFromCode } from '../sandbox';
import { STEEMCORD_CLIENT_ID } from '../constants';
import { Collection } from '@discordjs/collection';
import Presence from '../presence';
import { createRPC, destroyRPC, PresenceMetadata } from '../rpc';
import { currentPresences as devPresences } from './dev';
import RPC from 'discord-rpc';
import fs from 'fs';

export const presenceFolder = join(app.getPath('userData'), 'presences');
export let appIDsInFolder: number[] = [];
export const availableUpdates: Collection<number, PresenceMetadata> = new Collection();
export const emitter = new EventEmitter();
export let updateInterval: NodeJS.Timeout = null;
export let updatesExistedLastPoll = false;
export let rpc: RPC.Client = null;
export let rpcConnected = false;

export function reloadFolderIDs(): number[] {
  const appIDs = fs.readdirSync(presenceFolder)
    .filter(file => file.endsWith('.presence.ts'))
    .map(file => parseInt(file.split('.')[0]))
    .filter(id => !(isNaN(id) || !isFinite(id) || id === 0))
    .filter(id => settings.has(`apps.${id}.metadata`));
  appIDsInFolder = appIDs;
  return appIDs;
}

export async function start(): Promise<void> {
  // Create presence folder if it doesn't exist
  fs.access(join(app.getPath('userData'), 'presences'), fs.constants.F_OK, err => {
    if(err) fs.mkdirSync(presenceFolder);
  });

  await connect();
}

export async function connect(): Promise<boolean> {
  if (!rpcConnected) {
    try {
      rpc = new RPC.Client({ transport: 'ipc' });
      rpc.once('ready', () => {
        rpcConnected = true;
        emitter.emit('rpcConnected');
        const appIDs = reloadFolderIDs().filter(id => !devPresences.has(id));
        console.log('Main RPC ready, loading presences', appIDs);
        appIDsInFolder.forEach(appID => createFromInstalledPresence(appID));
      });
      // @ts-ignore
      rpc.once('disconnected', () => {
        appIDsInFolder.filter(id => !devPresences.has(id)).forEach(id => destroyRPC(id));
        rpcConnected = false;
        rpc.destroy();
        rpc = null;
        emitter.emit('rpcDisconnected');
      });
      await rpc.login({ clientId: STEEMCORD_CLIENT_ID });
    } catch (e) {
      console.log('Failed to connect main RPC', e);
      emitter.emit('rpcError');
      rpc.destroy();
      rpc = null;
      return false;
    }
  }
  return true;
}

export function createFromInstalledPresence(appID: number): void {
  const presenceFile = join(presenceFolder, `${appID}.presence.ts`);
  const presence = getPresenceFromCode(fs.readFileSync(presenceFile, 'utf8'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(presence instanceof Presence) || !presence.clientID || (presence as any)._eventsCount <= 0) {
    console.log(`Installed presence ${appID} has an invalid module, purging...`);
    settings.delete(`apps.${appID}.metadata`);
    fs.unlinkSync(presenceFile);
    return;
  }
  createRPC(presence, appID);
}

export async function checkForUpdates(): Promise<void> {
  availableUpdates.clear();
  for (const appID of appIDsInFolder) {
    const metadata = settings.get(`apps.${appID}.metadata`) as PresenceMetadata;
    if (!metadata.update_url) return;
    try {
      const newMetadata = await fetch(metadata.update_url).then(r => r.json()) as PresenceMetadata;
      if (newMetadata.version > metadata.version) {
        console.log('New version available for %s', appID);
        availableUpdates.set(appID, newMetadata);
      }
    } catch (e) {
      console.log('Failed to get metadata for %s', appID, e);
    }
  }
}

export async function installPresenceFromURL(metadataURL: string): Promise<void> {
  const metadata = await fetch(metadataURL).then(r => r.json()) as PresenceMetadata;

  if (!metadata.update_url)
    metadata.update_url = metadataURL;
  
  // Assume if teh URL ends with /metadata.json that theres a script in the same folder
  if (!metadata.script_url && metadataURL.endsWith('/metadata.json'))
    metadata.script_url = metadataURL.replace('/metadata.json', '/index.ts');
  
  if (!metadata.script_url)
    throw new Error('Couldn\'t find the script URL to go with this metadata.');
  
  const tsCode = await fetch(metadata.script_url).then(r => r.text());
  return installPresence(metadata, tsCode);
}

export function installPresence(metadata: PresenceMetadata, tsCode: string): void {
  const presence = getPresenceFromCode(tsCode);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(presence instanceof Presence) || !presence.clientID || (presence as any)._eventsCount <= 0)
    throw new Error('Invalid module.');
  settings.set(`apps.${metadata.app_id}.metadata`, metadata);
  fs.writeFileSync(join(presenceFolder, `${metadata.app_id}.presence.ts`), tsCode);
  createRPC(presence, metadata.app_id);
  reloadFolderIDs();
}

export function uninstallPresence(appID: number): void {
  destroyRPC(appID);
  settings.delete(`apps.${appID}.metadata`);
  settings.delete(`apps.${appID}.enabled`);
  fs.unlinkSync(join(presenceFolder, `${appID}.presence.ts`));
  reloadFolderIDs();
}

export async function autoUpdatePresences(initial = false): Promise<void> {
  if (!settings.get('autoCheckPresenceUpdates', true)) return;
  await checkForUpdates();
  if (settings.get('autoUpdatePresences', false)) {
    const updateNames: string[] = [];
    await Promise.all(Array.from(availableUpdates.values()).map(async metadata => {
      try {
        const tsCode = await fetch(metadata.script_url).then(r => r.text());
        console.log('Updating presence automatically', metadata.app_id);
        installPresence(metadata, tsCode);
        availableUpdates.delete(metadata.app_id);
        updateNames.push(metadata.name);
      } catch (e) {
        console.error('Failed to update presence automatically', metadata.app_id, e);
      }
    }));
    if (updateNames.length && settings.get('presenceNotifications', true))
      new Notification({
        title: `${updateNames.length.toLocaleString()} presence(s) were automatically updated.`,
        body: updateNames.join(', '),
        icon: '../resources/app/assets/icon.ico'
      }).show();
  } else if (!initial && !updatesExistedLastPoll && availableUpdates.size && settings.get('presenceNotifications', true))
    new Notification({
      title: `${availableUpdates.size.toLocaleString()} presence(s) are ready to be updated.`,
      body: Array.from(availableUpdates.values()).map(md => md.name).join(', '),
      icon: '../resources/app/assets/icon.ico'
    }).show();

  updatesExistedLastPoll = availableUpdates.size !== 0;
}

export async function startUpdateInterval(): Promise<void> {
  if (updateInterval) clearInterval(updateInterval);
  await autoUpdatePresences(true);
  updateInterval = setInterval(() => autoUpdatePresences(), settings.get('presencePollInterval', 60 * 60 * 1000) as number);
}

app.once('will-quit', () => { if(updateInterval) clearInterval(updateInterval); });