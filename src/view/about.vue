<template>
  <div id="aboutPage" class="page">
    <h3>About</h3>
    <p>Steemcord is an application that takes Steam's rich presence to Discord!</p>

    <a class="router-link" @click="openLink('https://snazzah.com/')">
      <GitHubLogo />
      <span>GitHub</span>
    </a>
    <a class="router-link" @click="openLink('https://github.com/sponsors/Snazzah')">
      <DonateIcon />
      <span>Sponsor this project</span>
    </a>
    <a class="router-link" @click="openLink('https://snaz.in/steemcord/discord')">
      <DiscordLogo />
      <span>Join Discord Server</span>
    </a>

    <h4>Contributors</h4>
    <div class="person-list">
      <div v-for="c in contributors" :key="c.name">
        <img
          class="icon"
          draggable="false"
          :src="c.avatar || `https://github.com/${c.github}.png`"
        >
        <div class="text">
          <span>{{ c.name }}</span>
          <span v-if="c.subtitle" class="subtitle">{{ c.subtitle }}</span>
        </div>
        <GitHubLogo
          v-if="c.github"
          v-tippy="{ arrow: true }"
          content="GitHub"
          @click="openLink(`https://github.com/${c.github}`)"
        />
        <SteamLogo
          v-if="c.steam"
          v-tippy="{ arrow: true }"
          content="Steam Profile"
          @click="openLink(c.steam)"
        />
        <WebsiteLogo
          v-if="c.website"
          v-tippy="{ arrow: true }"
          content="Website"
          @click="openLink(c.website)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const { shell } = window.require('electron');
import contributors from '../data/contributors.json';
// @ts-ignore
import GitHubLogo from './assets/svg/github.svg';
// @ts-ignore
import DonateIcon from './assets/svg/donate.svg';
// @ts-ignore
import DiscordLogo from './assets/svg/discord.svg';
// @ts-ignore
import WebsiteLogo from './assets/svg/website.svg';
// @ts-ignore
import SteamLogo from './assets/svg/steam.svg';

export default {
  components: {
    GitHubLogo, DonateIcon, DiscordLogo, WebsiteLogo, SteamLogo
  },
  data() {
    return {
      contributors
    };
  },
  methods: {
    openLink(url: string) {
      shell.openExternal(url);
    }
  }
};
</script>

<style lang="stylus">
#aboutPage
  h5
    margin-bottom 0
  .person-list
    display flex
    flex-direction column
    & > div
      margin .5em 0
      display flex
      position relative
      vertical-align middle
      align-items center
      .icon
        margin-right .5em
        width 40px
        height 40px
        display inline-flex
        border-radius 50%
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
      svg
        width 24px
        height 24px
        cursor pointer
        opacity .7
        transition opacity .2s ease
        & + svg
          margin-left 5px
        &:hover
          opacity 1
</style>