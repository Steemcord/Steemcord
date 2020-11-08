<template>
  <div class="dropdown-input">
    <div class="label-row">
      <label>{{ presenceSetting.title }}</label>
      <div class="select-outer">
        <label>
          <select
            ref="input"
            @change="set"
          >
            <option
              v-for="(v, i) in presenceSetting.values" :key="i" :value="i"
              :selected="value === i"
            >
              {{ v }}
            </option>
          </select>
        </label>
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
export default {
  props: {
    presenceSetting: {
      type: Object,
      default: () => { /* */ }
    },
  },
  data() {
    return {
      value: 0,
      modal: this.$parent
    };
  },
  mounted() {
    this.value = this.modal.getSetting(this.presenceSetting.key);
    this.$refs.input.selectedInput = this.value;
  },
  methods: {
    set() {
      this.modal.setSetting(this.presenceSetting.key, this.$refs.input.selectedIndex);
      this.value = this.$refs.input.selectedIndex;
    },
    reset() {
      const defaultValue = this.modal.resetSetting(this.presenceSetting.key);
      this.value = defaultValue;
      this.$refs.input.selectedIndex = defaultValue;
    }
  }
};
</script>

<style lang="stylus">
.dropdown-input
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
    & > label
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
    .select-outer
      position relative
      select
        -webkit-appearance none
        -moz-appearance none
        appearance none
        display block
        width 100%
        max-width 320px
        height 30px
        float right
        color #999
        margin 0px
        padding-right 32px
        padding-left 16px
        outline none
        font-weight 300
        font-size 16px
        line-height 1.75
        background-color #1b1c20
        border-radius 5px
        box-shadow inset 0px 0px 4px #000000
        box-shadow 0px 0px 7px 7px #141619 inset
        border 1px solid #141619
        -ms-word-break normal
        word-break normal
      &:after
        content '<>'
        font 17px 'Consolas', monospace
        color #ddd
        transform rotate(90deg)
        right 0
        top 5px
        padding 0
        border-bottom 1px solid #bbb
        position absolute
        pointer-events none
  .note
    color #fff
    cursor default
    font-size 14px
    line-height 20px
    font-weight 300
    opacity 0.5
</style>
