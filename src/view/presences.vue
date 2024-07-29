<template>
  <v-scroller
    id="presenceListPage"
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
const fuzzy = window.require('fuzzy');
const Collection = window.require('@discordjs/collection');
const presenceManager = remote.require('./managers/presence');
const directoryPoint = remote.require('./managers/directoryPoint');

export default {
  data() {
    return {
      ticker: 0,
      scrollItem: ScrollItem,
      loading: true,
      errorText: 'Loading...',
      metadatas: null,
      results: null,
      lockedPresences: new Collection()
    };
  },
  computed: {
    apps() {
      return this.$parent.apps ? this.$parent.apps : null;
    },
    scrollItems () {
      const header = { id: 'presences-header', type: 'header', text: 'Presences', refreshButton: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ((_) => this.ticker)();

      if (this.loading || !this.metadatas) return [
          { ...header, refreshButton: false },
          { id: 'loading-status', type: 'no-games',
            text: 'Loading...' }
        ];
      else if (this.errorText) return [
          { ...header, refreshButton: false },
          { id: 'loading-status', type: 'no-games',
            text: this.errorText },
          { id: 'loading-reload', type: 'reload-btn', text: 'Refresh' }
        ];
      
      let presences = this.metadatas.length ? this.metadatas.map(metadata => {
          const app = this.apps ? this.apps.get(metadata.app_id) : null;
          return {
            id: `s-${metadata.app_id}`,
            type: 'game',
            class: presenceManager.appIDsInFolder.includes(metadata.app_id) ? '' : 'white',
            store: true,
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
        }) : [{ id: 'no-games', type: 'no-games', text: 'No presences found.' }
      ];

      if (this.results) {
        presences = this.results.length ? this.results.map(({ string, original: metadata }) => {
          const app = this.apps ? this.apps.get(metadata.app_id) : null;
          return {
            id: `s-${metadata.app_id}`,
            type: 'game',
            class: presenceManager.appIDsInFolder.includes(metadata.app_id) ? '' : 'white',
            store: true,
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
        }) : [{ id: 'no-games', type: 'no-games', text: 'No presences matched the query.' }];
      }

      return [
        header,
        { id: 'search', type: 'search' },
        ...presences
      ];
    }
  },
  async created() {
    if (directoryPoint.lastRead.size === 0) {
      const result = await directoryPoint.readDirectoryPoint();
      if (!result) {
        this.errorText = 'Failed to read directory point.';
        this.loading = false;
        return;
      }
    }
    this.metadatas = directoryPoint.lastRead.array();
    this.errorText = null;
    this.loading = false;
  },
  methods: {
    async reload() {
      this.loading = true;
      this.errorText = null;
      const result = await directoryPoint.readDirectoryPoint();
      if (!result) {
        this.errorText = 'Failed to read directory point.';
        this.loading = false;
        return;
      }
      this.metadatas = directoryPoint.lastRead.array();
      this.loading = false;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async installPresence(metadata: any) {
      if (this.lockedPresences.has(metadata.app_id)) return;
      console.log('installing', metadata);
      if (presenceManager.appIDsInFolder.includes(metadata.app_id)) {
        if (!confirm(`There is already a presence installed for ${metadata.name}? Overwrite the presence?`)) return;
      }
      try {
        this.lockedPresences.set(metadata.app_id, true);
        const tsCode = await fetch(metadata.script_url).then(r => r.text());
        presenceManager.installPresence(metadata, tsCode);
        this.lockedPresences.delete(metadata.app_id);
        this.ticker = Date.now();
      } catch (e) {
        this.lockedPresences.delete(metadata.app_id);
        console.error('Faled to install presence %s', metadata.app_id, e);
        remote.dialog.showMessageBox({
          message: `Failed to install ${metadata.name}.\n${e}`
        });
      }
    },
    search(query: string) {
      if (!query.trim()) return this.results = null;
      query = query.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
      this.results = fuzzy.filter(query,
        this.metadatas
          .map(md => ({ ...md, safeName: md.name.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;') })),
        { pre: '<b>', post: '</b>', extract: md => md.safeName }
      );
    },
    presenceSettings(appID: number) {
      this.$modal.show(
        PresenceSettingsModal,
        { appID },
        { name: 'presence-settings', height: 'auto', width: '80%' }
      );
    },
  }
};
</script>