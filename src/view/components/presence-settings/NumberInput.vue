<template>
  <div class="number-input">
    <div class="label-row">
      <label>{{ presenceSetting.title }}</label>
      <input
        ref="input"
        :value="value"
        type="number"
        class="option-field"
        :min="presenceSetting.min" :max="presenceSetting.max"
        @change="set($event.target.value)"
      >
    </div>
    <div v-if="presenceSetting.note" class="note">
      {{ presenceSetting.note }}
    </div>
    <div v-if="value !== presenceSetting.default" class="input-reset-btn" @click="reset">
      Reset
    </div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    presenceSetting: {
      type: Object,
      default: () => { /* */ }
    },
  },
  data() {
    return {
      value: '',
      modal: this.$parent
    };
  },
  mounted() {
    this.value = this.modal.getSetting(this.presenceSetting.key);
  },
  methods: {
    set(value: string) {
      const prevValue = parseInt(this.$refs.input.value);
      const success = this.modal.setSetting(this.presenceSetting.key, parseInt(value));
      if (!success) this.$refs.input.value = prevValue;
      this.value = parseInt(this.$refs.input.value);
    },
    reset() {
      const defaultValue = this.modal.resetSetting(this.presenceSetting.key);
      this.value = defaultValue;
      this.$refs.input.value = defaultValue;
    }
  }
};
</script>

<style lang="stylus">
.number-input
  display flex
  flex-direction column
  margin-bottom 10px
  background-color #ddd1
  padding 10px
  border-radius 3px
  .label-row
    display flex
    flex-direction row
    width 100%
    align-items center
    label
      flex 1
      display block
      overflow hidden
      margin-top 0
      margin-bottom 0
      color #fff
      line-height 24px
      font-size 16px
      font-weight 300
      word-wrap break-word
    input
      background-color #1b1c20
      box-shadow inset 0px 0px 4px #000000
      border 1px solid #141619
      font-family 'Roboto Mono', monospace
      width 180px
      outline none
      padding 5px
      border-radius 3px
      color #999
      &::-webkit-inner-spin-button, ::-webkit-outer-spin-button
        opacity 1
  .note
    color #fff
    cursor default
    font-size 14px
    line-height 20px
    font-weight 300
    opacity 0.5
  .divider
    width 100%
    height 1px
    border-top thin #000
    margin-top 20px
  &.error input
    border-color crimson
    color crimson
</style>
