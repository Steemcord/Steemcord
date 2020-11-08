<template>
  <div class="dropdown-input">
    <div class="label-row">
      <label>{{ title }}</label>
      <div class="select-outer">
        <label>
          <select
            ref="input"
            @change="changed"
          >
            <option v-for="(v, i) in values" :key="i" :value="i">
              {{ v }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <div v-if="note" class="note">
      {{ note }}
    </div>
    <div v-if="defaultValue !== null && value !== defaultValue" class="input-reset-btn" @click="reset">
      Reset
    </div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    title: {
      type: String,
      default: 'Dropdown Field'
    },
    value: {
      type: Number,
      default: 0
    },
    note: {
      type: String,
      default: '',
    },
    defaultValue: {
      type: Number,
      default: null
    },
    values: {
      type: Array,
      default: null
    },
  },
  // @ts-ignore
  emits: ['input'],
  mounted() {
    this.$refs.input.value = this.value;
  },
  methods: {
    changed() {
      this.$emit('input', this.$refs.input.selectedIndex);
    },
    reset() {
      if(this.defaultValue === null) return;
      this.$refs.input.value = this.defaultValue;
      this.$emit('input', this.defaultValue);
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
