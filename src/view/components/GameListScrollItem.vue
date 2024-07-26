<template>
  <component
    :is="source.header || 'h3'"
    v-if="source.type === 'header'"
    :class="source.class || ''"
  >
    {{ source.text }}
    <RefreshIcon
      v-if="source.refreshButton"
      v-tippy="{ arrow: true, boundary: 'viewport' }"
      class="header-icon-btn"
      :content="source.refreshTooltip || 'Refresh'"
      @click="page.reload"
    />
  </component>
  <h4
    v-else-if="source.type === 'hidden-header'"
    class="hidden-header"
    :class="hiddenGamesShown ? 'shown' : ''"
    @click="page.showHiddenGames = !page.showHiddenGames"
  >
    {{ source.text }}
  </h4>
  <a 
    v-else-if="source.type === 'reload-btn'"
    class="router-link" @click="page.reload"
  >
    <RefreshIcon />
    <span>{{ source.text }}</span>
  </a>
  <div 
    v-else-if="source.type === 'search'"
    class="search-box"
  >
    <div>
      <SearchIcon v-if="!hasQuery" class="search-icon" />
      <CloseIcon
        v-else
        v-tippy="{ arrow: true, placement: 'bottom', boundary: 'viewport' }"
        class="search-icon clear-search"
        content="Clear Search"
        @click="updateSearch('', true)"
      />
      <input
        ref="input"
        type="text"
        placeholder="Search..."
        @input="!source.lazy ? updateSearch($event.target.value) : null"
        @change="source.lazy ? updateSearch($event.target.value) : null"
      >
    </div>
  </div>
  <div
    v-else-if="source.type === 'game'"
    class="game" :class="source.class || ''"
  >
    <div>
      <img
        v-if="source.app.img_icon_url"
        class="icon"
        draggable="false"
        :src="source.app.img_icon_url"
      >
      <GamesIcon
        v-else
        class="icon"
      />
      <NotOwnedIcon
        v-if="source.loggedIn && source.app.notFound"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="not-owned"
        content="Game Not Owned"
      />
      <div class="text">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-if="source.searchName" :title="source.app.name" v-html="searchSanitize(source.searchName)" />
        <span v-else :title="source.app.name">{{ source.app.name }}</span>
        <span v-if="source.metadata" class="subtitle" :title="`${source.metadata.version} - ${source.metadata.author.name}`">
          {{ source.metadata.version }} - {{ source.metadata.author.name }}
        </span>
      </div>
    </div>
    <div class="buttons">
      <CheckboxOnIcon
        v-if="source.installed && !source.class"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Disable"
        @click="page.toggleEnabled(source.app.appid)"
      />
      <CheckboxOffIcon
        v-else-if="source.installed && source.class === 'white'"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Enable"
        @click="page.toggleEnabled(source.app.appid)"
      />
      <UpdateIcon
        v-if="source.update"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Update"
        @click="page.updatePresence(source.app.appid)"
      />
      <InstallIcon
        v-if="source.store"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Install Presence"
        @click="page.installPresence(source.metadata)"
      />
      <SettingsIcon
        v-if="source.metadata && source.metadata.settings && !source.store"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Settings"
        @click="page.presenceSettings(source.app.appid)"
      />
      <SteamLogo
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Open Steam Store Page"
        @click="openLink(`https://store.steampowered.com/app/${source.app.appid.toString()}/`)"
      />
      <ClipboardIcon
        v-if="devMode"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Copy App ID"
        @click="copyToClipboard(source.app.appid.toString())"
      />
      <TrashIcon
        v-if="source.installed"
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="icon-btn"
        content="Uninstall"
        @click="page.uninstallPresence(source.app.appid)"
      />
    </div>
  </div>
  <span v-else-if="source.type === 'no-games'" class="no-games">
    {{ source.text }}
  </span>
</template>

<script lang="ts">
const { clipboard, shell } = window.require('electron');
import Vue from 'vue';
// @ts-ignore
import ClipboardIcon from '../assets/svg/clipboard.svg';
// @ts-ignore
import GamesIcon from '../assets/svg/games.svg';
// @ts-ignore
import CheckboxOnIcon from '../assets/svg/checkbox-on.svg';
// @ts-ignore
import CheckboxOffIcon from '../assets/svg/checkbox-off.svg';
// @ts-ignore
import TrashIcon from '../assets/svg/trash.svg';
// @ts-ignore
import RefreshIcon from '../assets/svg/refresh.svg';
// @ts-ignore
import InstallIcon from '../assets/svg/install.svg';
// @ts-ignore
import SteamLogo from '../assets/svg/steam.svg';
// @ts-ignore
import SearchIcon from '../assets/svg/search.svg';
// @ts-ignore
import CloseIcon from '../assets/svg/close.svg';
// @ts-ignore
import NotOwnedIcon from '../assets/svg/notowned.svg';
// @ts-ignore
import UpdateIcon from '../assets/svg/update.svg';
// @ts-ignore
import SettingsIcon from '../assets/svg/settings.svg';

export default Vue.extend({
  components: {
    ClipboardIcon, GamesIcon, CheckboxOnIcon, CheckboxOffIcon, TrashIcon, RefreshIcon,
    InstallIcon, SteamLogo, SearchIcon, CloseIcon, NotOwnedIcon, UpdateIcon, SettingsIcon
  },
  props: {
    source: {
      type: Object,
      required: true
    },
  },
  data () {
    return {
      page: this.$parent.$parent.$parent,
      hasQuery: false
    };
  },
  computed: {
    devMode() {
      return this.page.$parent.devMode;
    },
    hiddenGamesShown() {
      return this.page.showHiddenGames;
    }
  },
  methods: {
    copyToClipboard(str) {
      clipboard.writeText(str);
    },
    openLink(url: string) {
      shell.openExternal(url);
    },
    updateSearch(query: string, force = false) {
      this.hasQuery = !!query.trim();
      this.page.search(query);
      if (force) this.$refs.input.value = query;
    },
    searchSanitize(str: string) {
      return str.replace(/<b>&<\/b><b>a<\/b><b>m<\/b><b>p<\/b><b>;<\/b>/g, '<b>&amp;</b>').replace(/<b>&<\/b><b>g<\/b><b>t<\/b><b>;<\/b>/g, '<b>&gt;</b>').replace(/<b>&<\/b><b>l<\/b><b>t<\/b><b>;<\/b>/g, '<b>&lt;</b>');
    }
  }
});
</script>
