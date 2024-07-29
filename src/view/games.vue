<template>
  <v-scroller
    id="gameListPage"
    class="page-scroller"
    :data-key="'id'"
    :data-sources="scrollItems"
    :data-component="scrollItem"
  />
</template>

<script lang="ts">
import ScrollItem from './components/GameListScrollItem.vue';
import PresenceSettingsModal from './components/PresenceSettingsModal.vue';
const remote = window.require('@electron/remote');
const { shell } = window.require('electron');
const fuzzy = window.require('fuzzy');
const presenceManager = remote.require('./managers/presence');
const { settings } = remote.require('./managers/settings');
const Collection = window.require('@discordjs/collection');
const steam = remote.require('./steam');
const rpc = remote.require('./rpc');

export default {
  data() {
    return {
      ticker: 0,
      showHiddenGames: false,
      scrollItem: ScrollItem,
      lockedPresences: new Collection(),
      checkingForUpdates: false,
      results: null,
      allGamesResults: null,
      updatesResults: null,
    };
  },
  computed: {
    apps() {
      return this.$parent.apps ? this.$parent.apps : null;
    },
    availableUpdates() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ((_) => this.ticker)();

      let presences = presenceManager.availableUpdates.array().map(metadata => {
        const enabled = settings.get(`apps.${metadata.app_id}.enabled`, true);
        const app = this.apps ? this.apps.get(metadata.app_id) : null;
        return {
          id: `u-${metadata.app_id}`,
          type: 'game',
          class: enabled ? '' : 'white',
          update: true,
          metadata,
          app: {
            appid: metadata.app_id,
            ...(app ? {
              ...app,
              ...(metadata.icon ? { img_icon_url: metadata.icon } : {})
            }: {
              name: metadata.name, notFound: true,
              img_icon_url: metadata.icon
            })
          },
          loggedIn: !!this.$parent.userName
        };
      }).filter(v => !!v);

      if (this.updatesResults !== null && this.updatesResults.length === 0)
        return [];
      else if (this.updatesResults !== null)
        presences = this.updatesResults.map(({ string, original: metadata }) => {
          const enabled = settings.get(`apps.${metadata.app_id}.enabled`, true);
          const app = this.apps ? this.apps(metadata.app_id) : null;
          return {
            id: `u-${metadata.app_id}`,
            type: 'game',
            class: enabled ? '' : 'white',
            update: true,
            metadata,
            searchName: string,
            app: {
              appid: metadata.app_id,
              ...(app ? {
                ...app,
                ...(metadata.icon ? { img_icon_url: metadata.icon } : {})
              } : {
                name: metadata.name, notFound: true,
                img_icon_url: metadata.icon
              })
            },
            loggedIn: !!this.$parent.userName
          };
        });
      return presenceManager.availableUpdates.size ? [
        { id: 'updates-header', type: 'header', header: 'h4', text: `Updates Available (${presences.length.toLocaleString()})`, refreshButton: true },
        ...presences
      ] : [{ id: 'updates-check', type: 'reload-btn', text: 'Check For Updates', class: this.checkingForUpdates ? 'disabled' : '' }];
    },
    scrollItems() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ((_) => this.ticker)();

      let presences = presenceManager.appIDsInFolder.length ? presenceManager.appIDsInFolder.map(id => {
          const metadata = settings.get(`apps.${id}.metadata`);
          const enabled = settings.get(`apps.${id}.enabled`, true);
          const app = this.apps ? this.apps.get(id) : null;
          return {
            id: `i-${id}`,
            type: 'game',
            class: enabled ? '' : 'white',
            installed: true,
            metadata,
            app: {
              appid: metadata.app_id,
              ...(app ? {
                ...app,
                ...(metadata.icon ? { img_icon_url: metadata.icon } : {})
              } : {
                name: metadata.name, notFound: true,
                img_icon_url: metadata.icon
              })
            },
            loggedIn: !!this.$parent.userName
          };
        }) : [{ id: 'installed-none', type: 'no-games', text: 'No presences installed.' }];

      let allGames = this.apps ? this.apps.values().toArray().map((app: { appid: number }) => ({
        id: `h-${app.appid}`, type: 'game', class: 'white', app
      })) : null;
      
      if (this.allGamesResults !== null)
        allGames = this.allGamesResults.map(({ string, original: app }) => ({
          id: `h-${app.appid}`, type: 'game', class: 'white', app,
          searchName: string
        }));
      
      if (this.results !== null)
        presences = this.results.length ? this.results.map(({ string, original: metadata }) => {
          const enabled = settings.get(`apps.${metadata.app_id}.enabled`, true);
          const app = this.apps ? this.apps.get(metadata.app_id) : null;
          return {
            id: `i-${metadata.app_id}`,
            type: 'game',
            class: enabled ? '' : 'white',
            searchName: string,
            installed: true,
            metadata,
            app: {
              appid: metadata.app_id,
              ...(app ? {
                ...app,
                ...(metadata.icon ? { img_icon_url: metadata.icon } : {})
              } : {
                name: metadata.name, notFound: true,
                img_icon_url: metadata.icon
              })
            },
            loggedIn: !!this.$parent.userName
          };
        }) : [{ id: 'installed-none', type: 'no-games', text: 'No presences installed.' }];

      const activeApp = this.$parent.getActiveApp();
      return !this.apps ? [
        { id: 'games-header', type: 'header', text: 'Games' },
        { id: 'games-warn', type: 'no-games',
          text: 'You need to log in to show all games with more data.' },
        ...this.availableUpdates,
        { id: 'installed-header', type: 'header', header: 'h4', text: `Installed (${(this.results !== null ? this.results : presenceManager.appIDsInFolder).length.toLocaleString()})` },
        ...presences,
      ] : [
        { id: 'games-header', type: 'header', text: 'Games' },
        { id: 'search', type: 'search', lazy: true },
        ...(activeApp && this.results === null ? [
          { id: 'playing-header', type: 'header', class: 'playing', header: 'h4', text: 'Playing Now' },
          { id: `p-${activeApp}`, type: 'game', class: 'playing', app: activeApp }
        ] : []),
        ...this.availableUpdates,
        { id: 'installed-header', type: 'header', header: 'h4', text: `Installed (${(this.results !== null ? this.results : presenceManager.appIDsInFolder).length.toLocaleString()})` },
        ...presences,
        ...(this.updatesResults !== null && !allGames.length ? [] : [
          { id: 'hidden-header', type: 'hidden-header', text: `All Games (${allGames.length.toLocaleString()})` },
          ...(this.showHiddenGames ? allGames : [])
        ])
      ];
    }
  },
  methods: {
    openLink(url: string) {
      shell.openExternal(url);
    },
    getInstalledMetadatas () {
      return presenceManager.appIDsInFolder.map(id => settings.get(`apps.${id}.metadata`));
    },
    toggleEnabled(appID: number) {
      const enabled = !settings.get(`apps.${appID}.enabled`, true);
      settings.set(`apps.${appID}.enabled`, enabled);
      this.ticker = Date.now();
      if (!this.apps) return;
      if (!enabled)
        rpc.clearActivity(appID);
      else if (steam.activeGame && steam.activeGame.appID === appID)
        rpc.sendGamePresence(steam.activeGame);
    },
    uninstallPresence(appID: number) {
      if (!confirm(`Are you sure you want to uninstall the presence for ${settings.get(`apps.${appID}.metadata.name`)}?`)) return;
      console.log('Uninstalling presence %s', appID);
      presenceManager.uninstallPresence(appID);
      this.ticker = Date.now();
    },
    async updatePresence(appID: number) {
      if (this.lockedPresences.has(appID) || !presenceManager.availableUpdates.has(appID)) return;
      console.log('Updating presence %s', appID);
      const metadata = presenceManager.availableUpdates.get(appID);
      try {
        this.lockedPresences.set(appID, true);
        const tsCode = await fetch(metadata.script_url).then(r => r.text());
        presenceManager.installPresence(metadata, tsCode);
        this.lockedPresences.delete(appID);
        presenceManager.availableUpdates.delete(appID);
        this.ticker = Date.now();
      } catch (e) {
        this.lockedPresences.delete(appID);
        console.error('Faled to update presence %s', appID, e);
        remote.dialog.showMessageBox({
          message: `Failed to update ${metadata.name}.\n${e}`
        });
      }
    },
    async reload() {
      console.info('Reloading presence updates');
      this.checkingForUpdates = true;
      this.ticker = Date.now();
      await presenceManager.checkForUpdates();
      this.checkingForUpdates = false;
      this.ticker = Date.now();
    },
    presenceSettings(appID: number) {
      this.$modal.show(
        PresenceSettingsModal,
        { appID },
        { name: 'presence-settings', height: 'auto', width: '80%' }
      );
    },
    search(query: string) {
      if (!query.trim()) {
        this.results = null;
        this.allGamesResults = null;
        this.updatesResults = null;
        return;
      }
      function sanitize(str: string) {
        return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
      }
      query = query.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
      const installedMetadatas = this.getInstalledMetadatas();
      const updateMetadatas = presenceManager.availableUpdates.array();
      this.results = fuzzy.filter(query,
        installedMetadatas
          .map(md => ({ ...md, safeName: sanitize(md.name) })),
        { pre: '<b>', post: '</b>', extract: md => md.safeName }
      );
      this.allGamesResults = this.apps ? fuzzy.filter(query,
        this.apps.values().toArray()
          .map((app: { name: string }) => ({ ...app, safeName: sanitize(app.name) })),
        { pre: '<b>', post: '</b>', extract: app => app.safeName }
      ) : null;
      this.updatesResults = fuzzy.filter(query,
        updateMetadatas
          .map(md => ({ ...md, safeName: sanitize(md.name) })),
        { pre: '<b>', post: '</b>', extract: md => md.safeName }
      );
    }
  }
};
</script>

<style lang="stylus">
#gameListPage
  h4
    font-weight 300
    margin .5em 0
    &.hidden-header
      position relative
      cursor pointer
      opacity .5
      &.shown
        opacity .75
        &:before
          content '▲'
      &:before
        content '▼'
        display inline-block
        position absolute
        right 3px
        top 3px
        font-size 24px
</style>