<template>
  <div class="toggle-box" :class="value ? 'checked' : ''">
    <div class="label-row">
      <label>{{ presenceSetting.title }}</label>
      <div class="new-control">
        <span class="off-btn" @click="set(false)">OFF</span>
        <span class="on-btn" @click="set(true)">ON</span>
      </div>
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
import Vue from 'vue';

export default Vue.extend({
  props: {
    presenceSetting: {
      type: Object,
      default: () => { /* */ }
    },
  },
  data() {
    return {
      value: false,
      modal: this.$parent
    };
  },
  mounted() {
    this.value = this.modal.getSetting(this.presenceSetting.key);
  },
  methods: {
    set(value: boolean) {
      const prevValue = this.value;
      const success = this.modal.setSetting(this.presenceSetting.key, value);
      if (!success) this.value = prevValue;
      else this.value = value;
    },
    reset() {
      this.value = this.modal.resetSetting(this.presenceSetting.key);
    }
  }
});
</script>

<style lang="stylus">
.toggle-box
  display flex
  flex-direction column
  margin-bottom 10px
  background-color #ddd1
  padding 10px
  border-radius 3px
  &.disabled .new-control
    opacity 0.3
    cursor not-allowed
    & > span
      pointer-events none
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
    .new-control
      border-radius 3px
      display flex
      flex-direction row
      overflow hidden
      cursor pointer
      & > span
        background-color #3a3f48
        color #888
        display flex
        align-items center
        justify-content center
        font-size 14px
        width 60px
        height 30px
        transition background-color .15s ease, color .15s ease
        &:hover
          color #fff !important
          background-color #464d58
  &:not(.checked)
    .label-row .new-control .off-btn
      color #eee
      background-color #5f6875
  &.checked
    .label-row .new-control .on-btn
      color #eee
      background-color #2d73ff
  .note
    color #fff
    cursor default
    font-size 14px
    line-height 20px
    font-weight 300
    opacity 0.5
</style>
