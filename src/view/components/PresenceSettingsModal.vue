<template>
  <div v-if="loading" class="presence-settings-modal center-all" name="presence-settings">
    <h3>Loading...</h3>
  </div>
  <div v-else-if="!loading && !metadata" class="presence-settings-modal center-all" name="presence-settings">
    <h3>An error occurred! You don't have this presence installed!</h3>
  </div>
  <div v-else class="presence-settings-modal" name="presence-settings">
    <div class="header">
      <img
        v-if="metadata.icon || app.img_icon_url"
        :src="metadata.icon || app.img_icon_url"
        :title="app.name || metadata.name"
        :alt="app.name || metadata.name"
      >
      <GamesIcon v-else />
      <div class="header-text">
        <h3>{{ app.name || metadata.name }}</h3>
        <span>v{{ metadata.version }} by {{ metadata.author.name }}
          {{ metadata.contributors && metadata.contributors.length
            ? (metadata.contributors.length === 1
              ? ` & ${metadata.contributors[0].name} `
              : ` + ${metadata.contributors.length} others`)
            : ''
          }}
        </span>
      </div>
    </div>
    <div class="scroll-content">
      <div v-for="setting in metadata.settings" :key="setting.key" class="input-outer">
        <ToggleInput
          v-if="setting.type === 'checkbox'"
          :presence-setting="setting"
        />
        <TextInput
          v-else-if="setting.type === 'text'"
          :presence-setting="setting"
        />
        <NumberInput
          v-else-if="setting.type === 'number'"
          :presence-setting="setting"
        />
        <DropdownInput
          v-else-if="setting.type === 'dropdown'"
          :presence-setting="setting"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ToggleInput from './presence-settings/ToggleInput.vue';
import TextInput from './presence-settings/TextInput.vue';
import NumberInput from './presence-settings/NumberInput.vue';
import DropdownInput from './presence-settings/DropdownInput.vue';
const remote = window.require('@electron/remote');
const rpc = remote.require('./rpc');
const steam = remote.require('./steam');
const dev = remote.require('./managers/dev');
// @ts-ignore
import GamesIcon from '../assets/svg/games.svg';

export default {
  components: { GamesIcon, ToggleInput, TextInput, NumberInput, DropdownInput },
  props: {
    appID: {
      type: String,
      required: true
    }
  },
  // @ts-ignore
  emits: ['close'],
  data () {
    return {
      app: null,
      metadata: null,
      rpc: null,
      dev: false,
      loaded: false,
      aaa: false,
      settingData: {}
    };
  },
  mounted() {
    this.rpc = rpc.rpcClients.get(this.appID);
    if (!this.rpc) {
      this.loading = false;
      return;
    }
    this.metadata = this.rpc.getMetadata();
    this.app = steam.apps ? steam.apps.find(app => app.appid === this.appID) : {};
    this.dev = dev.currentPresences.has(this.appID);
    this.loading = false;
  },
  methods: {
    close () {
      this.$emit('close');
    },
    getSetting(key) {
      return this.rpc.getSetting(key);
    },
    setSetting(key, value) {
      return this.rpc.setSetting(key, value);
    },
    resetSetting(key) {
      return this.rpc.resetSetting(key);
    }
  }
};
</script>

<style lang="stylus">
.presence-settings-modal
  background #25282e
  background radial-gradient(circle at top left, rgba(74, 81, 92, 0.4) 0%, rgba(75, 81, 92, 0) 60%), #25282e
  &.center-all
    display flex
    align-items center
    justify-content center
    h3
      text-align center
      filter drop-shadow(2px 2px 4px #000)
  h3
    font-size 32px
    font-weight 300
    margin 0
    white-space nowrap
    text-overflow ellipsis
    overflow hidden
    width 100%
  .header
    display flex
    align-items center
    padding 10px
    background-color #0006
    svg, img
      flex-shrink 0
      width 64px
      height 64px
      margin-right 10px
      border-radius 10px
      filter drop-shadow(2px 2px 4px #000)
    .header-text
      display flex
      flex-direction column
      justify-content center
      filter drop-shadow(2px 2px 4px #000)
      span
        opacity .5
        font-size 14px
        flex-grow 1
        width 100%
        white-space nowrap
        text-overflow ellipsis
        overflow hidden
        font-weight 300
  .scroll-content
    max-height 500px
    overflow-x hidden
    overflow-y auto
    padding 20px
</style>
