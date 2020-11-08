/**
 * These typings are incomplete and only have values used in the app
 */

import { EventEmitter } from 'events'; // deepscan-disable-line UNUSED_IMPORT
import TypedEmitter from 'typed-emitter';
import SteamID from 'steamid';
export = SteamUser;

declare namespace SteamUser {
  enum EClientUIMode {
    None = 0,
    BigPicture = 1,
    Mobile = 2,
    Web = 3,
  }
  enum EPersonaState {
    Offline = 0,
    Online = 1,
    Busy = 2,
    Away = 3,
    Snooze = 4,
    LookingToTrade = 5,
    LookingToPlay = 6,
    Invisible = 7,
  }
  enum EResult {
    Invalid = 0,
    OK = 1,
    Fail = 2,
    NoConnection = 3,
  }
  enum EMachineIDType {
    None = 1,
    AlwaysRandom = 2,
    AccountNameGenerated = 3,
    PersistentRandom = 4,
  }
  interface SteamApp {
    appid: number
    name: string
    playtime_2weeks?: number
    playtime_forever: number
    img_icon_url: string
    img_logo_url: string
    has_community_visible_stats: boolean
    playtime_windows_forever: number
    playtime_mac_forever: number
    playtime_linux_forever: number
  }
  type LogOnDetails = LogOnDetailsWebSession | LogOnDetailsLoginKey | LogOnDetailsPassword;
}

interface SteamUserOptions {
  enablePicsCache?: boolean;
  picsCacheAll?: boolean;
  dataDirectory?: string;
  autoRelogin?: boolean;
  machineIdType?: SteamUser.EMachineIDType;
}

interface LogOnDetailsWebSession {
  accountName: string;
  webLogonToken: string;
  steamID: string;
}

interface LogOnDetailsLoginKey {
  accountName: string;
  loginKey: string;
  rememberPassword?: boolean;
  logonID?: number;
  machineName?: string;
  clientOS?: string;
}

interface LogOnDetailsPassword {
  accountName: string;
  password: string;
  authCode?: string;
  twoFactorCode?: string;
  rememberPassword?: boolean;
  logonID?: number;
  machineName?: string;
  clientOS?: string;
  dontRememberMachine?: boolean;
}

interface UserDetails {
  eresult: number;
  out_of_game_heartbeat_seconds: number;
  in_game_heartbeat_seconds: number;
  deprecated_public_ip: number;
  rtime32_server_time: number;
  account_flags: number;
  cell_id: number;
  email_domain: null;
  steam2_ticket: null;
  eresult_extended: null;
  webapi_authenticate_user_nonce: null;
  cell_id_ping_threshold: number;
  use_pics: null;
  vanity_url: string;
  public_ip: {
    v4: number;
  };
  client_supplied_steamid: string;
  ip_country_code: string;
  parental_settings: null;
  parental_setting_signature: null;
  count_loginfailures_to_migrate: number;
  count_disconnects_to_migrate: number;
  ogs_data_report_time_window: null;
  client_instance_id: string;
  force_client_update_check: null;
}

interface UserEventData {
  rich_presence: Array<{ key: string, value: string }>;
  persona_state: number;
  game_played_app_id: number;
  game_server_ip: number;
  game_server_port: number;
  persona_state_flags: number;
  online_session_instances: number;
  persona_set_by_user: null;
  player_name: string;
  query_port: number;
  steamid_source: string;
  avatar_hash: Buffer;
  last_logoff: Date;
  last_logon: Date;
  last_seen_online: Date;
  clan_rank: null;
  game_name: '';
  gameid: string;
  game_data_blob: Buffer;
  clan_data: null;
  clan_tag: null;
  broadcast_id?: string;
  game_lobby_id: string;
  watching_broadcast_accountid: null;
  watching_broadcast_appid: null;
  watching_broadcast_viewers: null;
  watching_broadcast_title: null;
  avatar_url_icon: string;
  avatar_url_medium: string;
  avatar_url_full: string;
  rich_presence_string?: string;
}

interface SteamUserIDEvents {
  [key: string]: (sid: SteamID, data: UserEventData) => void; 
}

type SteamUserEvents = SteamUserIDEvents & {
  loggedOn: (details: UserDetails) => void;
  disconnected: (eresult: SteamUser.EResult, msg?: string) => void;
  vanityURL: (url: string) => void;
  steamGuard: (domain: string | null, callback: (code: string) => void, lastCodeWrong: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appUpdate: (appID: number, data: any) => void;
  user: (sid: SteamID, data: UserEventData) => void;
  loginKey: (key: string) => void;
  debug: (message: string) => void;
  error: (err: Error) => void;
}

declare class SteamUser extends (EventEmitter as new () => TypedEmitter<SteamUserEvents>) {
  constructor(options?: SteamUserOptions)
  steamID: SteamID;

  logOn(options?: SteamUser.LogOnDetails): void
  logOff(): void

  setPersona(persona: SteamUser.EPersonaState): void
  setUIMode(mode: SteamUser.EClientUIMode): void

  getUserOwnedApps(steamid: string | SteamID, callback: (err?: Error, data?: { app_count: number; apps: SteamUser.SteamApp[] }) => void): void
  getUserOwnedApps(steamid: string | SteamID): Promise<{ app_count: number; apps: SteamUser.SteamApp[] }>
}

