import loggr from '../logger';
const logger = loggr('dev');

import chokidar from 'chokidar';
import { dialog, app } from 'electron';
import { readdirSync, readFileSync } from 'fs';
import { semver } from 'joi-extension-semver';
import { join, sep } from 'path';
import BaseJoi from 'joi';
import Collection from '@discordjs/collection';
import { createRPC, PresenceMetadata, RPCClient } from '../rpc';
import { getPresenceFromCode } from '../sandbox';
import { appIDsInFolder } from './presence';
import Presence from '../presence';
const Joi: BaseJoi.Root = BaseJoi.extend(semver);

interface DevPresence {
  path: string;
  watcher: chokidar.FSWatcher;
  metadata: PresenceMetadata;
  rpc?: RPCClient;
}

const metadataUser = Joi.object({
  name: Joi.string().min(1).required(),
  avatar: Joi.string().uri(),
  url: Joi.string().uri(),
  github: Joi.string().regex(/^\w{1,}$/),
});

const metadataSetting = {
  key: Joi.string().token().min(1).required(),
  title: Joi.string().required().max(256),
  note: Joi.string().max(1024),
};

const metadataSchema = Joi.object({
  $schema: Joi.string(),
  app_id: Joi.number().positive().min(1).required(),
  name: Joi.string().min(1).required(),
  altnames: Joi.array().items(Joi.string().min(1)).min(1),
  version: Joi.semver().valid().required(),
  icon: Joi.string().uri(),
  author: metadataUser.required(),
  contributors: Joi.array().items(metadataUser).min(1),
  description: Joi.string().min(1).max(2048),
  settings: Joi.array().items(
    // Text
    Joi.object({
      ...metadataSetting,
      type: Joi.string().valid('text').only().required(),
      placeholder: Joi.string().max(256),
      max_length: Joi.number().min(1),
      default: Joi.string().allow('').required()
    }),
    // Number
    Joi.object({
      ...metadataSetting,
      type: Joi.string().valid('number').only().required(),
      default: Joi.number().required(),
      min: Joi.number(),
      max: Joi.number()
    }),
    // Checkbox
    Joi.object({
      ...metadataSetting,
      type: Joi.string().valid('checkbox').only().required(),
      default: Joi.boolean().required()
    }),
    // Dropdown
    Joi.object({
      ...metadataSetting,
      type: Joi.string().valid('dropdown').only().required(),
      default: Joi.number().required().min(0),
      values: Joi.array().items(Joi.string()).min(1).required()
    })
  ).min(1).unique((a, b) => a.key === b.key),
  update_url: Joi.string().uri(),
  script_url: Joi.string().uri(),
});

export const currentPresences: Collection<number, DevPresence> = new Collection();
export const lockedPresences: Collection<number, boolean> = new Collection();

export function validateDir(path: string): string | PresenceMetadata {
  const files = readdirSync(path);

  if (files.includes('metadata.json') && files.includes('index.ts')) {
    try {
      // JSON validation
      const metadata = JSON.parse(readFileSync(join(path, 'metadata.json'), 'utf8'));
      const { error } = metadataSchema.validate(metadata);
      if (error) return `Metadata ${error.toString()}`;

      try {
        // Module validation
        const presence = getPresenceFromCode(readFileSync(join(path, 'index.ts'), 'utf8'));
        if (!(presence instanceof Presence))
          return 'The module does not return a Presence prototype.';
        if (!presence.clientID)
          return 'The Presence prototype does not have a client ID defined.';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((presence as any)._eventsCount <= 0)
          return 'The Presence does not have any listeners.';
      } catch (e) {
        return 'The module has errored while parsing. Please check for code errors.';
      }

      return metadata;
    } catch (e) {
      return 'The metadata.json is invalid and cannot be parsed.';
    }
  } else return 'No metadata.json and/or index.ts found.';
}

export async function watchDir(path: string): Promise<void> {
  const metadata: PresenceMetadata = JSON.parse(readFileSync(join(path, 'metadata.json'), 'utf8'));
  if (currentPresences.has(metadata.app_id)) return;
  const watchPath = path + sep;
  const watcher = chokidar.watch(watchPath, { ignoreInitial: true });
  currentPresences.set(metadata.app_id, { path, watcher, metadata });
  logger.info(`Watching dev presence ${metadata.app_id} (${path})`);

  watcher.on('all', eventName => {
    logger.info(`Rebuilding dev presence ${metadata.app_id} (${eventName})`);
    buildDevPresence(path);
  });

  buildDevPresence(path);
}

export async function destroyPresence(appID: number): Promise<void> {
  if (!currentPresences.has(appID)) return;
  const devPresence = currentPresences.get(appID);
  if (devPresence.rpc) devPresence.rpc.destroy();
  devPresence.watcher.close();
  currentPresences.delete(appID);
  logger.info('Unwatching dev presence', appID);
}

async function buildDevPresence(path: string) {
  const metadata: PresenceMetadata = JSON.parse(readFileSync(join(path, 'metadata.json'), 'utf8'));
  logger.info(`Building dev presence ${metadata.app_id} (${path})`);

  if (lockedPresences.has(metadata.app_id)) return;
  lockedPresences.set(metadata.app_id, true);

  try {
    const presence = getPresenceFromCode(readFileSync(join(path, 'index.ts'), 'utf8'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(presence instanceof Presence) || !presence.clientID || (presence as any)._eventsCount <= 0) return;

    const devPresence = currentPresences.get(metadata.app_id);
    if(devPresence.rpc) devPresence.rpc.destroy();
    // Destroy current RPC before creating another one to 
    devPresence.rpc = createRPC(presence, metadata.app_id, true, metadata);
    devPresence.metadata = metadata;
    currentPresences.set(metadata.app_id, devPresence);
    lockedPresences.delete(metadata.app_id);
  } catch (e) {
    logger.error('Failed to parse presence', e);
    return;
  }
}

export async function openFileDialog(path?: string): Promise<void> {
  if (!path) {
    app.focus();
    const openDialog = await dialog.showOpenDialog(null, {
      title: 'Select Presence Folder',
      message:
        'Please select the folder that contains the presence you want to load.\n(metadata.json, index.ts)',
      buttonLabel: 'Load Presence',
      properties: ['openDirectory']
    });
    if (openDialog.canceled)
      return console.info('Presence load canceled.');
    path = openDialog.filePaths[0];
  }
  const validationResult = validateDir(path);
  if (typeof validationResult === 'string') {
    const errDialog = await dialog.showMessageBox(null, {
      type: 'error',
      title: 'Invalid Presence Directory',
      message: validationResult,
      buttons: [
        'Retry',
        'Choose Another Directory',
        'Cancel'
      ]
    });
    if (errDialog.response === 2) return;
    return openFileDialog(errDialog.response === 0 ? path : null);
  }

  if (currentPresences.has(validationResult.app_id)) {
    const errDialog = await dialog.showMessageBox(null, {
      type: 'warning',
      title: 'Dev Presence Conflict',
      message: `There is already another dev presence with this App ID (${validationResult.app_id}).`,
      buttons: [
        'Overwrite',
        'Cancel'
      ]
    });
    if (errDialog.response === 1) return;
    destroyPresence(validationResult.app_id);
  }

  if (appIDsInFolder.includes(validationResult.app_id)) {
    const errDialog = await dialog.showMessageBox(null, {
      type: 'warning',
      title: 'Installed Presence Conflict',
      message: `There is already another presence installed with this App ID (${validationResult.app_id}).\nPlease uninstall this presence before loading this one.`,
      buttons: [
        'Overwrite',
        'Cancel'
      ]
    });
    if (errDialog.response === 1) return;
  }

  watchDir(path);
}

app.once('will-quit', () => 
  currentPresences.keyArray().forEach(appID => destroyPresence(appID)));