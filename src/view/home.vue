<template>
  <div v-if="!username" id="logInPage" class="page">
    <div class="landing">
      <SteemcordIcon />
      <h3>Welcome to Steemcord.</h3>
    </div>
    <div class="login-form" :class="loggingIn || username ? 'disable' : ''">
      <div class="field-outer">
        <label>Steam account name</label>
        <input
          ref="accountName"
          type="text"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        >
      </div>
      <div class="field-outer">
        <label>Password</label>
        <input
          ref="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        >
        <component
          :is="showPassword ? 'HideIcon' : 'ShowIcon'"
          class="show-pw"
          @click="showPassword = !showPassword"
        />
      </div>
      <ToggleInput
        v-model="rememberLogin"
        title="Remember Login"
      />
      <button class="login-button" @click="login">
        Log In
      </button>
      <a @click="openLink('https://help.steampowered.com/en/wizard/HelpWithLogin?redir=community%2Flogin%2Fhome%2F%3Fgoto%3Dhttps%253A%252F%252Fgithub.com%252FSteemcord')">
        Forgot your password?
      </a>
    </div>
    <span>Steemcord is <a @click="openLink('https://github.com/Steemcord/Steemcord')">open-source software</a> and does not send sensitive information to 3rd party sites or any installed presences.</span>
  </div>
  <div v-else id="homePage" class="page">
    <div class="header">
      <h3>Hello, {{ username }}!</h3>
      <div>
        <a class="router-link" @click="logout">
          <LogoutIcon />
          <span>Log Out</span>
        </a>
      </div>
    </div>
    <br>
    <br>
    <SteamHeader
      :username="username"
      :avatar="avatar"
      :status="isActiveGame ? 'ingame' : 'online'"
      :gamename="isActiveGame ? (getActiveApp() ? getActiveApp().name : '<unknown>') : 'Online'"
      :richpresence="isActiveGame ? activeGame.presenceString : null"
      :steamid="steamID"
    />
    <ArrowBlockedIcon
      v-if="isActiveGame && !currentPresence"
      class="arrow"
    />
    <ArrowIcon v-else class="arrow" />
    <DiscordHeader
      :user="discordUser"
      :type="isActiveGame && currentPresence ? 'playing' : 'normal'"
      :richpresence="isActiveGame ? currentPresence : null"
      :app="isActiveGame ? getActiveApp() : null"
    />
    <a
      v-if="isActiveGame && (activeGame.presenceString || activeGame.presence.length) && !currentPresence"
      class="router-link"
      @click="$router.push('/presences')"
    >
      <SearchIcon />
      <span>Search for a Presence</span>
    </a>
  </div>
</template>

<script lang="ts">
import ToggleInput from './components/ToggleInput.vue';
import SteamHeader from './components/SteamHeader.vue';
import DiscordHeader from './components/DiscordHeader.vue';
const remote = window.require('@electron/remote');
const { shell } = window.require('electron');
const steam = remote.require('./steam');
const { settings } = remote.require('./managers/settings');
// @ts-ignore
import ShowIcon from './assets/svg/show.svg';
// @ts-ignore
import HideIcon from './assets/svg/hide.svg';
// @ts-ignore
import LogoutIcon from './assets/svg/logout.svg';
// @ts-ignore
import SearchIcon from './assets/svg/search.svg';
// @ts-ignore
import SteemcordIcon from './assets/icon.svg';
// @ts-ignore
import ArrowIcon from './assets/arrow.svg';
// @ts-ignore
import ArrowBlockedIcon from './assets/arrow-blocked.svg';

export default {
  components: {
    ToggleInput, ShowIcon, HideIcon, LogoutIcon, SteemcordIcon, SearchIcon,
    ArrowBlockedIcon, ArrowIcon, SteamHeader, DiscordHeader
   },
  data() {
    return {
      rememberLogin: false,
      loggingIn: false,
      showPassword: false,
      errorDescriptions: {
        // https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EResult.js
        InvalidPassword: 'The account name or password that you have entered is incorrect.',
        InvalidLoginAuthCode: 'The e-mail auth code was incorrect!'
      }
    };
  },
  computed: {
    username() {
      return this.$parent.userName;
    },
    avatar() {
      return this.$parent.userAvatar;
    },
    activeGame() {
      return this.$parent.activeGame;
    },
    isActiveGame() {
      return this.$parent.activeGame && this.$parent.activeGame.appID !== 0;
    },
    discordUser() {
      return this.$parent.discordUser;
    },
    currentPresence() {
      return this.$parent.currentPresence;
    },
    steamID() {
      return this.username ? steam.steamID : null;
    },
  },
  methods: {
    openLink(url: string) {
      shell.openExternal(url);
    },
    getActiveApp() {
      return this.$parent.apps && this.activeGame ? this.$parent.apps.find(app => app.appid === this.activeGame.appID ) : null;
    },
    async login() {
      if (this.username) return;
      if (!this.$refs.accountName.value) return alert('Please enter an account name.');
      if (!this.$refs.password.value) return alert('Please enter a password.');
      this.loggingIn = true;
      const { event, result } = await steam.logOn({
        accountName: this.$refs.accountName.value.toLowerCase(),
        password: this.$refs.password.value,
        rememberPassword: this.rememberLogin,
        machineName: 'Steemcord'
      });
      if (event === 'steamError') {
        const error = result[0];
        const errorType = error.message;
        console.log('failed to log in', { error, errorType });
        alert(this.errorDescriptions[errorType] || 'Failed to log in: ' + errorType);
        if (errorType === 'InvalidPassword') this.$refs.password.value = '';
        this.$refs.password.focus();
      }
      if (event !== 'loggedOn')
        this.loggingIn = false;
      else steam.emitter.once('presence', () => (this.loggingIn = false));
    },
    logout() {
      settings.delete('login');
      steam.user.logOff();
    }
  }
};
</script>

<style lang="stylus">
#logInPage
  padding 0 1em !important
  margin-bottom -20px
  .landing
    width 100%
    svg
      width 100%
      height 128px
      filter drop-shadow(4px 4px 4px #000)
    h3
      text-align center
      margin 0
  .login-form
    display flex
    flex-direction column
    width 300px
    padding 30px calc(50% - 150px) 0
    transition opacity .2s ease
    & > *
      margin-bottom 18px
    .field-outer
      display flex
      flex-direction column
      width 300px
      position relative
      label
        font-size 14px
        color #b8b6b4
        margin-bottom 5px
        width 300px
      input
        background #32353C
        border-radius 3px
        color #E9E9E9
        padding 8px 6px
        display block
        box-shadow none
        width 286px
        transition border .2s ease
        border 1px solid #26282D
        font-weight normal
        &:focus
          outline none
          border-color #fff
      .show-pw
        position absolute
        cursor pointer
        bottom 5px
        right 5px
        width 24px
        height 24px
    .login-button
      text-shadow 1px 1px 0px rgba(0, 0, 0, 0.3)
      color #c3e1f8
      border-radius 2px
      border none
      padding 10px
      cursor pointer
      text-decoration none !important
      display block
      background #1a44c2
      background linear-gradient(to right, #47bfff 5%, #1a44c2 60%)
      box-shadow 2px 2px 5px rgba(0, 0, 0, 0.2)
      background-position 25%
      background-size 330% 100%
      font-size 15px
      outline none
    a
      color #ebebeb
      text-decoration none
      cursor pointer
      text-align center
      &:hover
        text-decoration underline
    &.disable
      pointer-events none
      opacity .5
      .login-button
        color #676d82
        background #425863
        background linear-gradient(to right,#425863 5%, #3b435c 60%)
  & > span
    font-size 14px
    text-align center
    width 100%
    color #e05d44
    display block
    a:hover
      text-decoration underline
      cursor pointer
#homePage
  .header
    & > *
      display inline-block
  .arrow
    width 100%
    height 50px
    margin 5px
    color #777
</style>