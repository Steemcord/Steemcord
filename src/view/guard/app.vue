<template>
  <div id="app">
    <div class="headframe">
      <ShieldIcon />
      <span>Steemcord Guard</span>
      <div class="buttons">
        <input
          v-if="canMinimize"
          draggable="false" type="image" src="../assets/minimize.svg"
          alt="Minimize" title="Minimize" @click="minimize"
        >
        <input
          draggable="false" type="image" src="../assets/close.svg"
          title="Close" @click="closeWindow"
        >
      </div>
    </div>
    <div v-if="loading" class="content">
      <h3>Loading...</h3>
    </div>
    <div v-else class="content">
      <div class="content-block">
        <div v-if="domain" class="header" :class="failedBefore ? 'error' : ''">
          <EmailIcon />
          <div class="header-text">
            <h4 v-if="failedBefore">
              That last code was incorrect!
            </h4>
            <h4 v-else>
              Check your E-Mail!
            </h4>
            <span>
              Steam (from noreply@steampowred.com) has sent you a login code in your e-mail on 
              <a
                v-if="domainMap[domain]" v-tippy="{ arrow: true }" class="valid"
                :content="'Open ' + domainMap[domain][0]" @click="openLink(domainMap[domain][1])"
              >{{ domain }}</a>
              <a v-else>{{ domain }}</a>. 
              <i>Make sure to check your spam folder!</i></span>
          </div>
        </div>
        <div v-else class="header" :class="failedBefore ? 'error' : ''">
          <PhoneIcon />
          <div class="header-text">
            <h4 v-if="failedBefore">
              That last code was incorrect!
            </h4>
            <h4 v-else>
              Check your Phone!
            </h4>
            <span>
              This account is currently using a Steam Guard Mobile Authenticator. 
              You should have recieved a notification with your auth code (you can also go to the app directly for the code).
              If you have trouble getting an auth code, 
              <a class="valid" @click="openLink('https://steamcommunity.com/login/home/?goto=')">log in from the browser</a>.
            </span>
          </div>
        </div>
        <a @click="openLink('https://support.steampowered.com/kb_article.php?ref=4020-ALZM-5519')">
          Contact Steam Support for help with account access
        </a>
        <div class="code-wrapper">
          <input
            ref="code"
            type="text"
            maxlength="5"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @input="validateInput"
            @keypress="submitCode"
          >
          <span>Press Enter to submit.<br>Close the window to cancel.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const remote = window.require('@electron/remote');
const { ipcRenderer, shell } = window.require('electron');
// @ts-ignore
import EmailIcon from './email.svg';
// @ts-ignore
import PhoneIcon from './phone.svg';
// @ts-ignore
import ShieldIcon from './shield.svg';

export default {
  components: {
    EmailIcon, PhoneIcon, ShieldIcon
  },
  data() {
    return {
      loading: true,
      domain: null,
      failedBefore: false,
      domainMap: {
        // Domain names with their respective mail urls
        // Extra points if there is search query
        'gmail.com': ['GMail', 'https://mail.google.com/mail/u/0/#search/noreply%40steampowered.com'],
        'yahoo.com': ['Yahoo Mail', 'https://mail.yahoo.com/d/search/keyword=noreply%2540steampowered.com']
      }
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
  mounted(): void {
    ipcRenderer.once('guard-init', (_, data) => {
      this.domain = data.domain;
      this.failedBefore = data.failedBefore;
      this.loading = false;
      this.$refs.code.focus();
    });
    ipcRenderer.send('guard-ready');
  },
  methods: {
    minimize() {
      return remote.getCurrentWindow().minimize();
    },
    closeWindow() {
      return remote.getCurrentWindow().close();
    },
    openLink(url: string) {
      shell.openExternal(url);
    },
    validateInput() {
      this.$refs.code.value = this.$refs.code.value.replace(/[^a-zA-Z0-9]/g, '');
    },
    submitCode(event: KeyboardEvent) {
      if ((event.code === 'Enter' || event.code === ' ') && this.$refs.code.value.length === 5)
        ipcRenderer.send('guard-callback', this.$refs.code.value);
    }
  }
};
</script>

<style lang="stylus">
@font-face
  font-family Roboto
  src url('../assets/fonts/Roboto-Regular.ttf') format('ttf')

@font-face
  font-family Roboto
  src url('../assets/fonts/Roboto-Italic.ttf') format('ttf')
  font-style italic

@font-face
  font-family Roboto
  font-weight 300
  src url('../assets/fonts/Roboto-Light.ttf') format('ttf')

@font-face
  font-family Roboto
  font-weight 300
  src url('../assets/fonts/Roboto-LightItalic.ttf') format('ttf')
  font-style italic

@font-face
  font-family Roboto
  font-weight 500
  src url('../assets/fonts/Roboto-Medium.ttf') fformat('ttf')

@font-face
  font-family Roboto
  font-weight 500
  src url('../assets/fonts/Roboto-MediumItalic.ttf') format('ttf')
  font-style italic

@font-face
  font-family 'Roboto Mono'
  font-weight 500
  src url('../assets/fonts/RobotoMono-Medium.ttf') format('ttf')

body, html
  font-family Roboto, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
  margin 0
  padding 0
  background-color #1b202b
  color #fff
  width 100%
  height 100%

#app
  padding-top 32px
  background #25282e
  background radial-gradient(circle at top left, rgba(74, 81, 92, 0.4) 0%, rgba(75, 81, 92, 0) 60%), #25282e
  height calc(100% - 32px)
  position relative
  user-select none
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
      width 16px
      height 16px
      padding 8px
      opacity .5
      padding-right 0
      margin-right -5px
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
    margin 0
    filter drop-shadow(2px 2px 4px #000)
  h4
    font-size 24px
  .content
    position fixed
    display flex
    justify-content center
    align-items center
    flex-direction column
    top 32px
    bottom 0
    left 0
    right 0
    .content-block
      display flex
      flex-direction column
      width calc(100% - 20px)
      position relative
      .header
        display flex
        vertical-align middle
        align-items center
        width 100%
        svg
          margin-right .5em
          border-radius 5px
          width 72px
          height 72px
          display inline-flex
          flex-grow 1
          flex-shrink 0
          color #66c0f4
          filter drop-shadow(2px 2px 4px #000)
        .header-text
          display flex
          flex-direction column
          vertical-align middle
          overflow hidden
          justify-content center
          width 100%
          h4
            color #66c0f4
          span
            width 100%
            font-weight 300
            overflow-wrap break-word
          a
            font-weight normal
            outline none
            &.valid
              font-weight bold
              &:hover
                cursor pointer
                text-decoration underline
        &.error
          svg, h4
            color #e05d44
      & > * + *
        margin-top 15px
      & > a
        font-weight normal
        outline none
        font-size 12px
        cursor pointer
        padding 0 10px
        text-align right
        &:hover
          text-decoration underline
  .code-wrapper
    display flex
    vertical-align middle
    align-items center
    justify-content center
    width 100%
    span
      font-size 14px
      opacity .6
      margin 0 10px
      width 175px
      font-weight 300
    input
      width 127px
      width 5.85ch
      letter-spacing 0.1em
      background-color #1b1c20
      box-shadow 0px 0px 7px 7px #141619 inset
      border 1px solid #141619
      color #ddd
      outline none
      text-transform uppercase
      font-size 36px
      font-family 'Roboto Mono', monospace
      padding 5px 10px
      border-radius 5px
      font-weight 500

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
</style>