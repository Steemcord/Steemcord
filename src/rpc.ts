import loggr from './logger';
const logger = loggr('rpc');

import RPC from 'discord-rpc';
import Presence, { PresenceData } from './presence';
import { app } from 'electron';
import { activeGame, MinimalGamePresence } from './steam';
import { settings } from './managers/settings';
import { Collection } from '@discordjs/collection';
import EventEmitter from 'eventemitter3';
import lodash from 'lodash';

export const rpcClients: Collection<number, RPCClient> = new Collection();
export const emitter = new EventEmitter();

let lastPresenceSet: number = null;
let lastPresenceActive: number = null;
export let lastPresence: PresenceData = null;

export interface PresenceMetadata {
  app_id: number;
  version: string;
  name: string;
  description?: string;
  icon?: string;
  update_url?: string;
  script_url?: string;
  author: {
    name: string;
    avatar?: string;
    url?: string;
  };
  settings?: Array<SettingMetadata>
}

export type SettingMetadata = {
  type: 'text',
  key: string,
  title: string;
  note?: string;
  default: string;
  placeholder?: string;
  max_length?: number;
} | {
  type: 'number',
  key: string,
  title: string;
  note?: string;
  default: number;
  min?: number;
  max?: number;
} | {
  type: 'checkbox',
  key: string,
  title: string;
  note?: string;
  default: boolean;
} | {
  type: 'dropdown',
  key: string,
  title: string;
  note?: string;
  default: number;
  values: Array<string>;
};

const TYPE_OF_CHECKS = {
  text: 'string',
  number: 'number',
  checkbox: 'boolean',
  dropdown: 'number'
};

type SettingType = string | number | boolean;

export class RPCClient {
  client: RPC.Client;
  presence: Presence;
  currentPresence: PresenceData;
  clientReady = false;
  dev = false;
  appID: number;
  private devMetadata: PresenceMetadata = null;
  private devSettings: Record<string, SettingType> = {};

  constructor(presence: Presence, appID: number, dev = false, devMetdata: PresenceMetadata = null) {
    this.dev = dev;
    this.devMetadata = devMetdata;
    this.presence = presence;
    this.appID = appID || presence.appID;
    this.presence.on('sendPresence', data => data ? this.setActivity(data) : this.clearActivity());

    this.client = new RPC.Client({ transport: 'ipc' });
    this.client.once('ready', () => {
      this.clientReady = true;
      const hasActiveGame = activeGame && activeGame.appID === this.appID;
      logger.info(`Client ready (${presence.clientID}, ${this.appID}, dev=${this.dev}, hasActiveGame=${hasActiveGame})`);
      if (hasActiveGame) sendGamePresence(activeGame);
    });

    rpcClients.set(this.appID, this);

    this.client.login({ clientId: presence.clientID }).catch(e => {
      logger.warn(`Failed to connect to IPC (${presence.clientID}, ${this.appID}, dev=${this.dev})`, e);
      this.destroy();
      setTimeout(() => createRPC(presence, this.appID, dev, devMetdata), 5000);
    });

    this.client.once(
      // @ts-ignore
      'disconnected',
      () => (rpcClients.delete(this.appID))
    );

    this.presence._getMetadata = () => this.getMetadata();
    this.presence._getSetting = (key: string) => this.getSetting(key);
    this.presence.emit('ready', this.getMetadata());

    logger.info(`Client created (${presence.clientID}, ${this.appID}, dev=${this.dev})`);
  }

  get enabled(): boolean {
    if (this.dev) return true;
    return settings.get(`apps.${this.appID}.enabled`, true) as boolean;
  }

  setActivity(presenceData?: PresenceData): void {
    presenceData = presenceData ? presenceData : this.currentPresence;

    if (!this.clientReady || !presenceData || !this.enabled || lastPresenceActive !== this.appID) return;

    // Generate a random ID for party values
    if (presenceData.partySize !== undefined && presenceData.partyMax !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      presenceData.partyId = Date.now().toString(36) + Math.random().toString(36).split('.')[1];
    else if (presenceData.partySize !== undefined || presenceData.partyMax !== undefined) {
      // Prevent Discord from erroring
      delete presenceData.partySize;
      delete presenceData.partyMax;
    }

    this.client
      .setActivity(presenceData)
      .catch(e => logger.error('Activity Set Error', e));

    this.currentPresence = presenceData;
    this.presence.currentPresence = presenceData;
    lastPresenceSet = this.appID;
    lastPresence = presenceData;
    emitter.emit('update');
    logger.info(`Activity Updated (${this.presence.clientID}, ${this.appID})`);
  }

  clearActivity(): void {
    this.currentPresence = null;
    this.presence.currentPresence = null;
    if (lastPresenceSet === this.appID) {
      lastPresenceSet = null;
      lastPresence = null;
      emitter.emit('update');
    }

    if (!this.clientReady) return;

    this.client.clearActivity().catch(e => logger.error('Activity Clear Error', e));
    logger.info(`Activity Cleared (${this.presence.clientID}, ${this.appID})`);
  }

  getMetadata(): PresenceMetadata {
    return this.dev ? this.devMetadata : settings.get(`apps.${this.appID}.metadata`, {
      app_id: this.appID,
      name: 'N/A',
      author: { name: 'N/A' },
      version: '0.0.1'
    }) as PresenceMetadata;
  }

  getSettingMetadata(key: string): SettingMetadata {
    const metadata = this.getMetadata();
    if (!metadata.settings || !metadata.settings.find(s => s.key === key)) return null;
    return metadata.settings.find(s => s.key === key);
  }

  getSetting(key: string): SettingType {
    const metadata = this.getSettingMetadata(key);
    if (!metadata) return;
    let currentValue = (this.dev
      ? lodash.get(this.devSettings, key, metadata.default)
      : settings.get(`apps.${this.appID}.settings.${key}`, metadata.default)) as string | number | boolean;

    // If the setting type does not match the current value, default it
    if (typeof currentValue !== TYPE_OF_CHECKS[metadata.type])
      currentValue = metadata.default;

    return currentValue;
  }

  setSetting(key: string, value: string | number | boolean): boolean {
    const metadata = this.getSettingMetadata(key);
    if (!metadata) return false;
    if (typeof value !== TYPE_OF_CHECKS[metadata.type]) return false;
    this.dev
      ? lodash.set(this.devSettings, key, value)
      : settings.set(`apps.${this.appID}.settings.${key}`, value);
    this.presence.emit('settingUpdate', key, value);
    return true;
  }

  resetSetting(key: string): string | number | boolean {
    const metadata = this.getSettingMetadata(key);
    if (!metadata) return;
    const defaultValue = metadata.default;
    this.dev
      ? lodash.set(this.devSettings, key, defaultValue)
      : settings.delete(`apps.${this.appID}.settings.${key}`);
    this.presence.emit('settingUpdate', key, defaultValue);
    return metadata.default;
  }

  destroy(): void {
    try {
      if (this.clientReady) {
        this.client.clearActivity();
        this.client.removeAllListeners();
        this.client.destroy();
      }
      if (lastPresenceSet === this.appID) {
        lastPresenceSet = null;
        lastPresence = null;
        emitter.emit('update');
      }
      this.presence.removeAllListeners();
      rpcClients.delete(this.appID);
      logger.info(`Client Destroyed (${this.presence.clientID}, ${this.appID})`);
    } catch (err) { /* no-op */ }
  }
}

export function sendGamePresence(presence?: MinimalGamePresence): void {
  if (!presence) return clearActivity();
  const rpc = rpcClients.get(presence.appID);
  if (presence.appID === 0) return clearActivity();
  else if (rpc) {
    lastPresenceActive = presence.appID;
    const presenceObj: { [key: string]: string } = {};
    presence.presence.forEach(({ key, value }) => presenceObj[key] = value);
    rpc.presence.emit('richPresenceUpdate', {
      presenceArray: presence.presence,
      presenceString: presence.presenceString,
      presence: presenceObj
    });
  }
}

export function setActivity(presence: MinimalGamePresence, presenceData: PresenceData): void {
  const rpc = rpcClients.get(presence.appID);
  if (rpc) {
    rpc.client.setActivity(presenceData);
    lastPresenceActive = presence.appID;
  }
}

export function clearActivity(appID?: number): void {
  if (appID) {
    lastPresenceActive = appID;
    if (rpcClients.has(appID)) rpcClients.get(appID).clearActivity();
  } else {
    Array.from(rpcClients.values()).forEach(rpc => rpc.clearActivity());
    lastPresenceActive = null;
    lastPresenceSet = null;
    lastPresence = null;
    emitter.emit('update');
  }
}

export function createRPC(presence: Presence, appID: number, dev = false, devMetadata: PresenceMetadata = null): RPCClient {
  if (rpcClients.has(appID))
    rpcClients.get(appID).destroy();
  return new RPCClient(presence, appID, dev, devMetadata);
}

export function destroyRPC(appID: number): void  {
  const rpc = rpcClients.get(appID);
  if (rpc) rpc.destroy();
}

export function getMetadata(appID: number): PresenceMetadata {
  return settings.get(`apps.${appID}.metadata`, {
    app_id: appID,
    name: 'N/A',
    author: 'N/A',
    version: '0.0.0'
  }) as PresenceMetadata;
}

app.once(
  'will-quit',
  async () => await Promise.all(Array.from(rpcClients.values()).map(c => c.destroy()))
);