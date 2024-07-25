import loggr from './logger';
const logger = loggr('steam');
const presenceLogger = loggr('steam/presence');

import { AbortSignal } from 'abort-controller';
import EventEmitter from 'eventemitter3';
import { EventEmitter as EventEmitter1 } from 'events';
import TypedEmitter from 'typed-emitter';
import SteamUser from 'steam-user';
import { join } from 'path';
import { app, Notification } from 'electron';
import { sendGamePresence } from './rpc';
import { prompt, killPrompt } from './guard';
import { settings } from './managers/settings';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class AnyTypedEmitter extends (EventEmitter1 as new () => TypedEmitter<any>) {}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const waitForEither = <T extends any[]>(emitter: EventEmitter | AnyTypedEmitter, events: string[], signal?: AbortSignal): Promise<{ event: string; result: T }> => new Promise((resolve, reject) => {
  if (signal)
    signal.addEventListener('abort', () => reject(null));
  // @ts-ignore
  events.forEach(event => emitter.once(event, (...result: T) => resolve({ event, result })));
});

export interface MinimalGamePresence {
  appID: number;
  presence: Array<{ key: string, value: string }>;
  presenceString?: string;
}
  
// Prepare steam user data folder
const dataFolder = join(app.getPath('userData'), 'steam-user');
try {
  fs.accessSync(dataFolder, fs.constants.F_OK);
} catch (e) {
  fs.mkdirSync(dataFolder);
}

export const user = new SteamUser({
  enablePicsCache: true,
  picsCacheAll: true,
  autoRelogin: true,
  dataDirectory: dataFolder,
  renewRefreshTokens: true,
  machineIdType: (settings.get('machineIDType', 1) as number) + 2
});

export const emitter = new EventEmitter();
emitter.on('presence', data => sendGamePresence(data));

// Event routing for waitForEither purposes
user.on('loggedOn', data => emitter.emit('loggedOn', data));
user.on('error', err => emitter.emit('steamError', err));
user.on('steamGuard', (domain, callback, lastCodeWrong) => emitter.emit('steamGuard', domain, callback, lastCodeWrong));

export let userName: string = null;
export let userAvatar: string = null;
export let accountName: string = null;
export let steamID: string = null;
export let apps: any = null;
// export let apps: Array<OwnedApp> = null;
export let activeGame: MinimalGamePresence = null;
export let steamGuardAvailable = true;

// PlayerClient.NotifyFriendEquippedProfileItemsChanged#1 - avatar frames

/*
this.HasStateFlag(4) - is_golden
this.HasStateFlag(8) - PersonaStateRemotePlayTogether
e.prototype.HasStateFlag = function(e) {
  return 0 != (this.m_unPersonaStateFlags & e)
}

// @ts-ignore
user._handlerManager.add('PlayerClient.NotifyFriendEquippedProfileItemsChanged#1', (body) => {
  console.log('a frames', body);
})
*/

user.on('debug', async msg => {
  logger.log('debug', msg);
});

user.on('error', async err => {
  logger.error(err);
});

user.on('ownershipCached', async () => {
  await updateApps();
});

user.on('changelist', async () => {
  await updateApps();
});


user.on('refreshToken', async refreshToken => {
  // @ts-ignore
  logger.info('New refresh token:', refreshToken, user._logInDetails);
  settings.set('login', { refreshToken });
});

user.on('loggedOn', async details => {
  logger.info(`Logged In as ${details.vanity_url} (${details.client_supplied_steamid})`);
  steamID = details.client_supplied_steamid;
  user.setPersona(SteamUser.EPersonaState.Online);
  user.setUIMode(SteamUser.EClientUIMode.Web);
  emitter.emit('loggedOn', details);
});

user.on('steamGuard', async (domain, callback, lastCodeWrong) => {
  logger.info(`Steam Guard Requested (domain=${domain}, lastCodeWrong=${lastCodeWrong})`);
  if (!steamGuardAvailable) return emitter.emit('cancelSteamGuard');
  killPrompt();
  const code = await prompt(domain, lastCodeWrong);
  if (!code) return emitter.emit('cancelSteamGuard');
  else callback(code);
});

user.on('disconnected', (eresult, msg) => {
  logger.info(`Disconnected: ${msg} (${eresult})`);
  apps = null;
  userName = null;
  userAvatar = null;
  activeGame = null;
  accountName = null;
  emitter.emit('presence', activeGame);
  emitter.emit('appsUpdate', apps);
});

user.on('user', async (sid, data) => {
  if (user.steamID && sid.accountid === user.steamID.accountid) {
    userName = data.player_name;
    userAvatar = data.avatar_url_full;

    if (data.gameid === '0') {
      activeGame = { appID: 0, presence: [], presenceString: null };
      emitter.emit('presence', activeGame);
      return presenceLogger.info('No game detected');
    }

    // Wait till apps are populated
    while (apps === null) await wait(500);

    const app = apps.get(data.game_played_app_id);

    if (!app) {
      activeGame = { appID: 0, presence: [], presenceString: null };
      emitter.emit('presence', activeGame);
      presenceLogger.warn(`Unknown app found (${data.game_played_app_id})`);
    } else {
      activeGame = {
        appID: data.game_played_app_id,
        presence: data.rich_presence,
        presenceString: data.rich_presence_string || null
      };
      emitter.emit('presence', activeGame);
      presenceLogger.info(app.name, `(${activeGame.appID}):`, activeGame.presenceString);
    }
  }
});

export async function updateApps(): Promise<void> {
  try {
    const data = await user.getUserOwnedApps(user.steamID, { includePlayedFreeGames: true, includeFreeSub: true });
    let newApps = null;
    // There's currently a mismatch between node-steam-user and @types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tempApps = (data as any).apps;
    if (tempApps && tempApps.length) {
      tempApps.sort((a: { name: string; }, b: { name: string; }) => a.name.normalize().localeCompare(b.name.normalize()));
      newApps = new Map(
        tempApps.map((app: { appid: number; }) => [app.appid, app])
      );
    }
    apps = newApps;
    emitter.emit('appsUpdate', apps);
  } catch (err) {
    logger.error('Failed to get user apps', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export async function logOn(options: any): Promise<{ event: string; result: any[]; }> {
  user.logOn(options);
  const { event, result } = await waitForEither(emitter, ['loggedOn', 'steamError', 'cancelSteamGuard']);
  if (event === 'loggedOn') accountName = options.accountName;
  return { event, result };
}

export async function autoLogin(): Promise<void> {
  if (!settings.has('login')) return;
  logger.info('Autologging on');
  steamGuardAvailable = false;
  const { event, result } = await logOn({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(settings.get('login') as any),
    machineName: 'Steemcord',
  });
  steamGuardAvailable = true;
  logger.info('Autologging result:', event, result);
  if (event !== 'loggedOn' && settings.get('steamNotifications', true)) {
    new Notification({
      title: 'Failed to log in to Steam',
      body: 'You will need to manually log in to Steam.',
      icon: join(__dirname, './assets/icon.ico')
    }).show();
    settings.delete('login');
  }
}

app.once(
	'will-quit',
	async () => user.logOff()
);