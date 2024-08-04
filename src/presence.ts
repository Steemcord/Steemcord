import EventEmitter from 'eventemitter3';

interface PresenceOptions {
  clientID: string;
  appID?: number;
  module?: NodeModule;
}

export interface PresenceData {
  state?: string;
  details?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  partySize?: number;
  partyMax?: number;
  partyId?: string;
}

interface PresenceMetadata {
  app_id: number;
  name: string;
}

export default class Presence extends EventEmitter {
  clientID: string;
  appID: number;
  currentPresence: PresenceData = null;
  _getMetadata: () => PresenceMetadata = null;
  _getSetting: (key: string) => string | number | boolean = null;

  constructor(options: PresenceOptions) {
    super();
    this.clientID = options.clientID;
    this.appID = options.appID;

    if (options.module)
      options.module.exports = this;
  }

  getMetadata(): PresenceMetadata {
    if (this._getMetadata) return this._getMetadata();
  }

  getSetting(key: string): string | number | boolean {
    if (this._getSetting) return this._getSetting(key);
  }

  setActivity(presenceData: PresenceData): void {
    this.emit('sendPresence', presenceData);
  }

  clearActivity(): void {
    this.emit('sendPresence', null);
  }
}