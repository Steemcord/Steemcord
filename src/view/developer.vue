<template>
  <div id="developerPage" class="page">
    <h3>Developer</h3>
    <a class="router-link" @click="openFolder">
      <FolderIcon />
      <span>Load Presence</span>
    </a>
    <a v-if="hasConflicts" class="router-link" @click="reinitRPCClients">
      <RevertIcon />
      <span>Reinitialize RPC Clients</span>
    </a>
    <a class="router-link" @click="openDevTools">
      <DevToolsIcon />
      <span>Open Developer Tools</span>
    </a>

    <div v-if="activeGamePresence && activeGamePresence.length">
      <h4>Rich Presence Data</h4>
      <table>
        <tbody>
          <tr v-for="row in activeGamePresence" :key="row">
            <td>{{ row.key }}</td>
            <td>{{ row.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h4>
      Watched Presences
      <RefreshIcon
        v-tippy="{ arrow: true, boundary: 'viewport' }"
        class="header-icon-btn"
        content="Refresh"
        @click="reloadPresences"
      />
    </h4>
    <span v-if="!currentPresences.length" class="no-games">
      No presences loaded.
    </span>

    <div
      v-for="presence in currentPresences"
      v-else
      :key="presence.metadata.app_id"
      class="game"
    >
      <div>
        <img
          v-if="presence.app"
          class="icon"
          draggable="false"
          :src="presence.app.img_icon_url"
        >
        <div class="text">
          <span>{{ presence.app ? presence.app.name : presence.metadata.name }} ({{ presence.metadata.app_id }})</span>
          <span class="subtitle" :title="presence.path">{{ presence.path }}</span>
        </div>
      </div>
      <div class="buttons">
        <SettingsIcon
          v-if="presence.metadata.settings"
          v-tippy="{ arrow: true, boundary: 'viewport' }"
          class="icon-btn"
          content="Settings"
          @click="presenceSettings(presence.metadata.app_id)"
        />
        <FolderIcon
          v-tippy="{ arrow: true, boundary: 'viewport' }"
          class="icon-btn"
          content="Open Folder"
          @click="openPath(presence.path)"
        />
        <TrashIcon
          v-tippy="{ arrow: true, boundary: 'viewport' }"
          class="icon-btn"
          content="Unload Presence"
          @click="destroyPresence(presence.metadata.app_id)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import PresenceSettingsModal from './components/PresenceSettingsModal.vue';
const { remote, shell } = window.require('electron');
const dev = remote.require('./managers/dev');
const rpc = remote.require('./rpc');
const presenceManager = remote.require('./managers/presence');
// @ts-ignore
import FolderIcon from './assets/svg/folder.svg';
// @ts-ignore
import RefreshIcon from './assets/svg/refresh.svg';
// @ts-ignore
import TrashIcon from './assets/svg/trash.svg';
// @ts-ignore
import RevertIcon from './assets/svg/revert.svg';
// @ts-ignore
import DevToolsIcon from './assets/svg/devtools.svg';
// @ts-ignore
import SettingsIcon from './assets/svg/settings.svg';

export default {
  components: {
    FolderIcon, RefreshIcon, TrashIcon, RevertIcon, DevToolsIcon, SettingsIcon
  },
  data() {
    return {
      currentPresences: [],
      hasConflicts: false
    };
  },
  computed: {
    activeGamePresence() {
      return this.$parent.activeGame ? this.$parent.activeGame.presence : null;
    }
  },
  mounted() {
    this.reloadPresences();
  },
  methods: {
    async openFolder() {
      await dev.openFileDialog();
      this.reloadPresences();
    },
    reloadPresences() {
      const apps = this.$parent.apps || [];
      this.currentPresences = dev.currentPresences.array().map(p => ({ ...p, app: apps.find(app => app.appid === p.metadata.app_id) }));
      this.hasConflicts = !!presenceManager.appIDsInFolder.filter(appID => dev.currentPresences.has(appID)).length
        || presenceManager.appIDsInFolder.map(id => rpc.rpcClients.has(id)).includes(false);
    },
    openPath(path: string) {
      shell.openPath(path);
    },
    destroyPresence(appID: number) {
      dev.destroyPresence(appID);
      this.reloadPresences();
    },
    presenceSettings(appID: number) {
      this.$modal.show(
        PresenceSettingsModal,
        { appID },
        { name: 'presence-settings', height: 'auto', width: '80%' }
      );
    },
    reinitRPCClients() {
      // Load conflicting IDs
      const conflictingIDs = presenceManager.appIDsInFolder.filter(appID => dev.currentPresences.has(appID));
      conflictingIDs.forEach(appID => {
        dev.destroyPresence(appID);
        presenceManager.createFromInstalledPresence(appID);
      });
      // Load non-existant RPCs
      presenceManager.appIDsInFolder.filter(id => !rpc.rpcClients.has(id))
        .forEach(id => presenceManager.createFromInstalledPresence(id));
      this.reloadPresences();
    },
    openDevTools() {
      remote.getCurrentWindow().webContents.openDevTools();
    }
  }
};
</script>

<style lang="stylus">
#developerPage
  table
    user-select text
    td
      font-family monospace
      margin .5em
      padding .5em
      &:nth-child(1)
        background-color #0003
        font-weight bold
      &:nth-child(2)
        background-color #0001
</style>