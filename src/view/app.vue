<template>
  <div id="app">
    <div class="headframe">
      <MonotoneIcon />
      <span>Steemcord</span>
      <div class="buttons">
        <input
          v-if="canMinimize"
          draggable="false" type="image" src="./assets/minimize.svg"
          alt="Minimize" title="Minimize" @click="minimize"
        >
        <input
          v-if="canMaximize"
          draggable="false" type="image" src="./assets/maximize.svg"
          title="Maximize/Restore" @click="maximizeOrRestore"
        >
        <input
          draggable="false" type="image" src="./assets/close.svg"
          title="Close" @click="closeWindow"
        >
      </div>
    </div>
    <div class="sidebar">
      <!-- <div v-if="updateProgress" class="update-progress">
        <b class="bar">
          <i class="progress" />
        </b>
        <span>Downloading update...</span>
        <span>67% - 10 MB/s</span>
      </div> -->
      <div v-if="nextUpdateAvailable" class="update-banner" @click="updateApp">
        <span>Version <b>{{ nextUpdateAvailable }}</b> is available!</span>
        <span>Click to update</span>
      </div>
      <div v-if="userName" class="sidebar-header" :class="activeGame && getActiveApp() ? 'playing' : ''">
        <img
          class="icon"
          draggable="false"
          :src="userAvatar"
        >
        <div class="text">
          <span class="username" :title="userName">{{ userName }}</span>
          <span v-if="activeGame && getActiveApp()" class="header-game">
            <img
              draggable="false"
              :src="getActiveApp().img_icon_url"
            >
            <span :title="getActiveApp().name">{{ getActiveApp().name }}</span>
            <RichPresenceIcon v-if="activeGame.presence.length" v-tippy="{ arrow: true, placement: 'right', boundary: 'viewport' }" content="This game is outputting rich presence." />
          </span>
        </div>
      </div>
      <a v-else class="router-link login" @click="logIn">
        <LogInIcon class="icon" />
        <div class="text">
          <span>Log In</span>
        </div>
      </a>
      <a v-if="discordStatus === 1" to="home" class="discord-status">
        <span>Connecting to Discord...</span>
      </a>
      <a
        v-if="discordStatus === 3" to="home" class="discord-status warn"
        @click="reconnectDiscord"
      >
        <IssueIcon />
        <span>Reconnect to Discord</span>
      </a>
      <router-link to="home" class="router-link">
        <HomeIcon />
        <span>Home</span>
      </router-link>
      <router-link to="presences" class="router-link">
        <TreeIcon />
        <span>Presences</span>
      </router-link>
      <router-link to="games" class="router-link">
        <GamesIcon />
        <span>Games</span>
      </router-link>
      <router-link to="settings" class="router-link">
        <SettingsIcon />
        <span>Settings</span>
      </router-link>
      <router-link to="about" class="router-link">
        <AboutIcon />
        <span>About</span>
      </router-link>
      <router-link v-if="devMode" to="dev" class="router-link">
        <DeveloperIcon />
        <span>Developer</span>
      </router-link>
      <span class="version">Steemcord v{{ version }}</span>
    </div>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
const remote = window.require('@electron/remote');
const steam = remote.require('./steam');
const constants = remote.require('./constants');
const rpc = remote.require('./rpc');
const presenceManager = remote.require('./managers/presence');
const settingsManager = remote.require('./managers/settings');
const updater = remote.require('./managers/update');
// @ts-ignore
import SettingsIcon from './assets/svg/settings.svg';
// @ts-ignore
import AboutIcon from './assets/svg/about.svg';
// @ts-ignore
import GamesIcon from './assets/svg/games.svg';
// @ts-ignore
import RichPresenceIcon from './assets/svg/richpresence.svg';
// @ts-ignore
import DeveloperIcon from './assets/svg/developer.svg';
// @ts-ignore
import LogInIcon from './assets/svg/login.svg';
// @ts-ignore
import TreeIcon from './assets/svg/tree.svg';
// @ts-ignore
import HomeIcon from './assets/svg/home.svg';
// @ts-ignore
import IssueIcon from './assets/svg/issue.svg';
// @ts-ignore
import MonotoneIcon from './assets/monotone-icon.svg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getComputedSettings(settings: [string, any][]) {
  return {
    fillData: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: { [key: string]: any } = {};
      settings.forEach((setting) => { data[setting[0]] = settingsManager.settings.get(setting[0], setting[1]); });
      return data;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateData: (ref: any) => {
      settings.forEach((setting) => { ref[setting[0]] = settingsManager.settings.get(setting[0], setting[1]); });
    }
  };
}

const computedSettings = getComputedSettings([
  ['devMode', false],
  ['autoLaunch', true],
  ['showWindowOnLaunch', true],
  ['minimizeToTray', true],
  ['autoUpdatePresences', false],
  ['presencePollInterval', 60 * 60 * 1000],
  ['autoCheckPresenceUpdates', true],
  ['presenceNotifications', true],
  ['steamNotifications', true],
  ['regenLoginKey', false],
  ['machineIDType', 1]
]);

export default {
  components: {
    SettingsIcon, AboutIcon, GamesIcon, RichPresenceIcon, DeveloperIcon, LogInIcon, TreeIcon,
    HomeIcon, IssueIcon, MonotoneIcon
  },
  data() {
    return {
      version: constants.VERSION,
      apps: steam.apps,
      userAvatar: steam.userAvatar,
      userName: steam.userName,
      activeGame: steam.activeGame,
      currentPresence: rpc.lastPresence,
      discordUser: presenceManager.rpc ? presenceManager.rpc.user : null,
      nextUpdateAvailable: updater.updateAvailable,
      ...computedSettings.fillData()
    };
  },
  computed: {
    canMinimize(): boolean {
      return remote.getCurrentWindow().isMinimizable();
    },
    canMaximize(): boolean {
      return remote.getCurrentWindow().isMaximizable();
    }
  },
  created(): void {
    this.discordStatus = presenceManager.rpcConnected ? 2 : 3;

    const appsEventBind = apps => this.apps = apps;
    const presenceEventBind = presence => {
      this.userName = steam.userName;
      this.userAvatar = steam.userAvatar;
      this.activeGame = steam.activeGame;
      console.log('Presence update', presence);
    };
    const connectBind = () => {
      this.discordStatus = 2;
      this.discordUser = presenceManager.rpc.user;
    };
    const disconnectBind = () => {
      this.discordStatus = 3;
      this.discordUser = null;
    };
    const rpcBind = () => this.currentPresence = rpc.lastPresence;
    const updateBind = ver => this.nextUpdateAvailable = ver;
    const debugBind = message => console.log('[steam]', message);

    steam.emitter.on('appsUpdate', appsEventBind);
    steam.emitter.on('presence', presenceEventBind);
    steam.user.on('debug', debugBind);
    presenceManager.emitter.on('rpcConnected', connectBind);
    presenceManager.emitter.on('rpcDisconnected', disconnectBind);
    presenceManager.emitter.on('rpcError', disconnectBind);
    rpc.emitter.on('update', rpcBind);
    presenceManager.emitter.on('update', updateBind);
  
    const unloadBind = () => { 
      steam.emitter.removeListener('appsUpdate', appsEventBind);
      steam.emitter.removeListener('presence', presenceEventBind);
      steam.user.removeListener('debug', debugBind);
      presenceManager.emitter.removeListener('rpcConnected', connectBind);
      presenceManager.emitter.removeListener('rpcDisconnected', disconnectBind);
      presenceManager.emitter.removeListener('rpcError', disconnectBind);
      rpc.emitter.removeListener('update', rpcBind);
      presenceManager.emitter.removeListener('update', updateBind);

      window.removeEventListener('unload', unloadBind);
    };
    window.addEventListener('unload', unloadBind);
  },
  methods: {
    minimize() {
      return remote.getCurrentWindow().minimize();
    },
    maximizeOrRestore() {
      const win = remote.getCurrentWindow();
      return win.isMaximized() ? win.restore() : win.maximize();
    },
    closeWindow() {
      return this.minimizeToTray ? remote.getCurrentWindow().hide() : remote.getCurrentWindow().close();
    },
    getActiveApp() {
      return this.apps && this.activeGame ? this.apps.find(app => app.appid === this.activeGame.appID ) : null;
    },
    updateSettings() {
      computedSettings.updateData(this);
      settingsManager.update();
    },
    async logIn() {
     if (this.$router.currentRoute.path !== '/home') this.$router.push('/home');
    },
    abortAuth() {
      if (this.abortController)
        this.abortController.abort();
      this.abortController = null;
      this.$modal.hide('authenticating');
    },
    async reconnectDiscord() {
      this.discordStatus = 1;
      if (presenceManager.rpc) await presenceManager.rpc.destroy();
      const success = await presenceManager.connect();
      if (!success) alert('Couldn\'t connect to Discord. Make sure that the client is running.');
    },
    updateApp() {
      updater.updater.quitAndInstall(true, true);
    }
  }
};
</script>

<style lang="stylus">
@font-face
  font-family Roboto
  src url('./assets/fonts/Roboto-Regular.ttf') format('ttf')

@font-face
  font-family Roboto
  src url('./assets/fonts/Roboto-Italic.ttf') format('ttf')
  font-style italic

@font-face
  font-family Roboto
  font-weight 300
  src url('./assets/fonts/Roboto-Light.ttf') format('ttf')

@font-face
  font-family Roboto
  font-weight 500
  src url('./assets/fonts/Roboto-Medium.ttf') format('ttf')

@font-face
  font-family Roboto
  font-weight 500
  src url('./assets/fonts/Roboto-MediumItalic.ttf') format('ttf')
  font-style italic

@font-face
  font-family Roboto
  font-weight 700
  src url('./assets/fonts/Roboto-Bold.ttf') format('ttf')

@font-face
  font-family 'Roboto Mono'
  font-weight 500
  src url('./assets/fonts/RobotoMono-Medium.ttf') format('ttf')

body, html
  margin 0
  padding 0
  background-color #1b202b
  color #fff
  width 100%
  height 100%
  &, input, select
    font-family Roboto, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
*
  outline none
  &::-webkit-scrollbar
    width 15px
  &::-webkit-scrollbar-thumb
    border-radius 10px
    background-color #0002
    transition background-color .2s ease
    z-index 12
    border 4px solid rgba(0, 0, 0, 0)
    background-clip padding-box
    margin 4px
    min-height 32px
    min-width 32px
  &:hover::-webkit-scrollbar-thumb
    background-color #0005
#app
  padding-top 32px
  background #25282e
  background radial-gradient(circle at top left, rgba(74, 81, 92, 0.4) 0%, rgba(75, 81, 92, 0) 60%), #25282e
  height calc(100% - 32px)
  position relative
  user-select none
  input:not([type="image"])
    user-select text
  .headframe
    position fixed
    top 0
    left 0
    right 0
    -webkit-app-region drag
    -webkit-user-select none
    background-color #111
    svg
      float left
      width 32px
      height 32px
      opacity .5
      padding-right 0
      margin-left 10px
    span
      float left
      font-size 12px
      line-height 12px
      padding 10px
      font-weight 700
      opacity .5
    .buttons
      float right
      font-size 12px
      display flex
      -webkit-app-region no-drag
      input
        width 15px
        height 15px
        padding 8px
        outline none
        &:hover
          cursor pointer
          background-color #fff1
  h3, h4
    font-size 32px
    font-weight 300
    margin-top .5em
    margin-bottom .25em
    filter drop-shadow(2px 2px 4px #000)
    .header-icon-btn
      position absolute
      right 15px
      opacity .5
      cursor pointer
      outline none
      width 30px
      height 30px
      margin-top 6px
      transition opacity .2s ease
      &:hover
        opacity 1
    &:nth-child(1)
      margin-top 1em
  h4
    font-size 24px
    .header-icon-btn
      width 20px
      height 20px
      margin-top 3px
  .update-banner
    margin-bottom 10px
    padding 10px
    display flex
    flex-direction column
    background-color #2ecc7144
    cursor pointer
    span
      &:nth-child(2)
        font-size 10px
  .update-progress
    margin-bottom 10px
    display flex
    flex-direction column
    position relative
    b
      width 100%
      margin-bottom 5px
      position relative
      height 5px
      display block
      i
        width 50%
        height 100%
        background-color #2ecc71
        display block
    span
      font-size 10px
      padding 0 10px
      &:nth-child(2)
        font-size 14px
  .sidebar
    font-size 16px
    background-color #0002
    width 15rem
    position fixed
    z-index 10
    margin 0
    top 32px
    left 0
    bottom 0
    box-sizing border-box
    overflow-y auto
    .sidebar-header
      padding 1em
      margin .5em 0
      display flex
      position relative
      vertical-align middle
      align-items center
      filter drop-shadow(2px 2px 4px #000)
      &.playing
        .icon
          border-color #90ba3c
        .text span
          color #90ba3c
      .icon
        margin-right .5em
        width 40px
        height 40px
        display inline-flex
        border 2px solid #66c0f4
        flex-shrink 0
      .text
        display inline-flex
        flex-direction column
        align-content baseline
        align-items baseline
        vertical-align middle
        overflow hidden
        justify-content center
        width 100%
        span
          white-space nowrap
          text-overflow ellipsis
          overflow hidden
          width 100%
          color #66c0f4
          font-weight 300
          &.username
            font-size 20px
          &.header-game
            display flex
            vertical-align middle
            align-items center
            img
              width 14px
              height 14px
              margin-right .25em
              flex-shrink 0
            span
              opacity .5
              font-size 14px
              flex-grow 1
              width 100%
              white-space nowrap
              text-overflow ellipsis
              overflow hidden
            svg
              width 14px
              height 14px
              flex-shrink 0
              opacity .5
              transition opacity .2s ease
              &:hover
                opacity 1
                transition opacity .2s ease
    .discord-status
      display flex
      padding 10px
      margin 15px
      border-radius 5px
      align-items center
      text-align center
      text-decoration none
      color #fff
      background-color #ddd1
      &.warn
        cursor pointer
        color #ff0
        background-color #f1c40f11
        transition background-color .2s ease
        &:hover
          background-color #f1c40f33
      svg
        margin-right 10px
        width 24px
        height 24px
      span
        font-weight 300
    .version
      position absolute
      bottom 5px
      left 5px
      opacity .5
      font-weight 300
  .router-link
    display flex
    padding 10px
    margin 5px
    border-radius 5px
    align-items center
    text-align center
    text-decoration none
    color #fff
    cursor pointer
    background-color #0000
    transition background-color .2s ease
    &.login
      margin 16px 10px
      padding 15px 8px
      svg
        margin-right 10px
        width 30px
        height 30px
        transition color .2s ease
      span
        font-size 24px
        transition color .2s ease
      &:hover span, &:hover svg
        color #66c0f4
    svg
      margin-right 10px
      width 24px
      height 24px
    span
      font-weight 300
    &:hover
      background-color #0002
    &.router-link-exact-active
      background-color #0005
  main
    padding-bottom 2rem
    padding-left 15rem
    position relative
    height calc(100% - 32px)
    overflow hidden auto
    .page
      padding 1em
    .page-scroller
      padding 15px
      overflow hidden auto
      height calc(100% - 30px)
  .no-games
    font-weight 300
    font-size 14px
    opacity .5
    display block
    text-align center
    margin 2em 0
  .game
    margin .5em
    margin-right 0  
    display flex
    vertical-align middle
    align-items center
    border-radius 5px
    padding 10px
    background-color #0000
    transition background-color .2s ease
    position relative
    &:hover
      background-color #0002
      .buttons
        opacity 1
    & > div
      display flex
      vertical-align middle
      align-items center
      flex-grow 1
      &:nth-child(1)
        text-align left
        justify-content flex-start
        width 100%
      &:nth-child(2)
        text-align right
        justify-content flex-end
        position absolute
        right .5em
    .not-owned
      position absolute
      width 24px
      height 24px
      left 2px
      bottom 2px
      opacity .75
    .icon
      margin-right .5em
      border-radius 5px
      width 40px
      height 40px
      display inline-flex
      flex-grow 1
      flex-shrink 0
      color #66c0f4
      transition color .2s ease
    .text
      display inline-flex
      flex-direction column
      align-content baseline
      align-items baseline
      vertical-align middle
      overflow hidden
      justify-content center
      width 100%
      span
        white-space nowrap
        text-overflow ellipsis
        overflow hidden
        width 100%
        color #66c0f4
        font-weight 300
        font-size 20px
        &.subtitle
          font-size 14px
          opacity .5
    .buttons
      display flex
      vertical-align middle
      align-items center
      opacity 0
      flex-shrink 0
      transition opacity .2s ease
      .icon-btn
        width 24px
        height 24px
        color #fff
        outline none
        cursor pointer
        & + .icon-btn
          margin-left 5px
  h3.playing, .game.playing .text span
    color #90ba3c
  .game.white
    .text span, .icon
      color #fff
  [role="listitem"]
    display flex
    height 60px
    padding 4px
    justify-content center
    flex-direction column
    h3, h4
      margin 0
      width 100%
    .search-box
      display flex
      flex-direction column
      margin-bottom 10px
      background-color #ddd1
      padding 10px
      border-radius 3px
      & > div
        display flex
        vertical-align middle
        align-items center
        flex-grow 1
        & + div
          margin-top 3px
      .search-icon
        width 24px
        height 24px
        margin-right 10px
        outline none
        &.clear-search
          cursor pointer
      input
        background-color #1b1c20
        box-shadow 0px 0px 7px 7px #141619 inset
        border 1px solid #141619
        outline none
        padding 5px
        border-radius 3px
        font-size 16px
        width 100%
        color #999
        &::placeholder
          opacity .5

.input-reset-btn
  cursor pointer
  margin-top 10px
  font-weight 300
  opacity .25
  transition opacity .2s ease
  &:hover
    text-decoration underline
    opacity .75

.tippy-tooltip.steemcord-theme
  background-color #000
  color #fff
  &[x-placement^='top'] .tippy-arrow
    border-top-color #000
  &[x-placement^='bottom'] .tippy-arrow
    border-bottom-color #000
  &[x-placement^='left'] .tippy-arrow
    border-left-color #000
  &[x-placement^='right'] .tippy-arrow
    border-right-color #000


.vm--overlay
  background rgba(0, 0, 0, 0.4)

.vm--modal
  opacity 1
  transform-origin 50% 50%
  transform scale(1, 1)
  border-radius 10px
  box-shadow 0 0 10px 0 alpha(#000, 0.1)
  background transparent
  filter blur(0px)

.vm-transition--modal-enter,
.vm-transition--modal-leave-active
  opacity 0
  transform-origin 50% 50%
  transform scale(1.1, 1.1)
  filter blur(2px)

.vm-transition--modal-leave-active
  opacity 0
  transform-origin 50% 50%
  transform scale(0.8, 0.8)
  filter blur(2px)

.vm--overlay
  opacity 1
  transition opacity .2s ease

.vm-transition--overlay-enter,
.vm-transition--overlay-leave-active
  opacity 0
  transition opacity .2s ease
</style>