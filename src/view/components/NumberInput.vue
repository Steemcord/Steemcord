<template>
  <div class="number-input" :class="error ? 'error' : ''">
    <div class="label-row">
      <label>{{ title }}</label>
      <input
        ref="input"
        :value="value"
        type="number"
        class="option-field"
        :min="min || false" :max="max || false"
        @input="validate($event.target.value)"
        @change="$el.classList.contains('error') ? null : $emit('input', parseInt($event.target.value))"
      >
    </div>
    <div v-if="note" class="note">
      {{ note }}
    </div>
    <div v-if="defaultValue !== null && value != defaultValue" class="input-reset-btn" @click="reset">
      Reset
    </div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    title: {
      type: String,
      default: 'Number Field'
    },
    value: {
      type: Number,
      default: 0
    },
    placeholder: {
      type: String,
      default: 'Text...'
    },
    note: {
      type: String,
      default: '',
    },
    defaultValue: {
      type: Number,
      default: null
    },
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
  },
  // @ts-ignore
  emits: ['input'],
  methods: {
    validate(value: number) {
      if (this.min && value < this.min || this.max && value > this.max) {
        return this.$el.classList.add('error');
      }
      this.$el.classList.remove('error');
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
