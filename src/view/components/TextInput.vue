<template>
  <div class="text-input" :class="error ? 'error' : ''">
    <div class="label-row">
      <label>{{ title }}</label>
      <input
        ref="input"
        :value="value"
        type="text"
        :placeholder="placeholder"
        :autocomplete="url ? 'off' : 'on'"
        :autocorrect="url ? 'off' : 'on'"
        :autocapitalize="url ? 'off' : 'on'"
        :spellcheck="!url"
        class="option-field"
        @input="validate($event.target.value)"
        @change="$el.classList.contains('error') ? null : $emit('input', $event.target.value)"
      >
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
      default: 'Text Field'
    },
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Text...'
    },
    note: {
      type: String,
      default: '',
    },
    url: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: String,
      default: null
    },
    error: {
      type: Boolean,
      default: false
    },
  },
  // @ts-ignore
  emits: ['input'],
  methods: {
    validate(value: string) {
      if (this.url) {
        const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/;
        if (!urlRegex.test(value))
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
.text-input
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
      box-shadow 0px 0px 7px 7px #141619 inset
      border 1px solid #141619
      outline none
      width 180px
      padding 5px
      border-radius 3px
      color #999
      &::placeholder
        opacity .5
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
