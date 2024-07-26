<template>
  <div v-if="user" class="discord-header" :class="type === 'playing' ? 'playing' : ''">
    <header class="header">
      <div class="avatar-wrapper">
        <svg
          width="92" height="80" viewBox="0 0 92 80"
          class="mask svg" aria-hidden="true"
        >
          <mask id="svg-mask-avatar-status-round-80" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
            <circle
              fill="white" cx="0.5" cy="0.5"
              r="0.5"
            />
            <circle
              fill="black" cx="0.85" cy="0.85"
              r="0.175"
            />
          </mask>
          <mask id="svg-mask-status-online" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
            <circle
              fill="white" cx="0.5" cy="0.5"
              r="0.5"
            />
          </mask>
          <mask id="svg-mask-large-image-key" maskContentUnits="objectBoundingBox" viewBox="0 0 90 90">
            <path
              d="M90,64.7510955 L90,5 C90,2.23857625 87.7614237,-5.07265313e-16 85,0 L5,0 L5,0 C2.23857625,5.07265313e-16 -3.38176876e-16,2.23857625 0,5 L0,5 L0,85 C3.38176876e-16,87.7614237 2.23857625,90 5,90 L64.7510955,90 C62.399336,86.9581075 61,83.14247 61,79 C61,69.0588745 69.0588745,61 79,61 C83.14247,61 86.9581075,62.399336 90,64.7510955 Z"
            />
          </mask>
          <foreignObject
            x="0" y="0" width="80"
            height="80" mask="url(#svg-mask-avatar-status-round-80)"
          >
            <img
              :src="avatarURL"
              class="avatar-img"
            >
          </foreignObject>
          <rect
            v-tippy="{ arrow: true }"
            content="Online"
            width="16" height="16" x="60"
            y="60" mask="url(#svg-mask-status-online)"
            class="statusCircle"
          />
        </svg>
      </div>
      <div class="headerInfo">
        <div class="nameTag">
          <span class="username">{{ user.global_name || user.username }}</span>
          <span v-if="user.discriminator !== '0'" class="discriminator">#{{ user.discriminator }}</span>
        </div>
        <div class="profileBadges">
          <!-- <div class="profileBadgeWrapper-1rGSsp">
            <div aria-label="Early Verified Bot Developer">
              <div class="" role="button" tabindex="0">
                <div class="profileBadge-2niAfJ profileBadgeVerifiedDeveloper-195KfD" />
              </div>
            </div>
          </div> -->
        </div>
      </div>
      <div>
        <svg
          class="additionalActionsIcon"
          width="24" height="24" viewBox="0 0 24 24"
        >
          <g fill="none" fill-rule="evenodd">
            <path d="M24 0v24H0V0z" />
            <path fill="currentColor" d="M12 16c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2-2-.8954305-2-2 .8954305-2 2-2zm0-6c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2-2-.8954305-2-2 .8954305-2 2-2zm0-6c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2-2-.8954305-2-2 .8954305-2 2-2z" />
          </g>
        </svg>
      </div>
    </header>
    <div v-if="type === 'playing' && richpresence" class="headerFill">
      <div class="activity">
        <span class="headerText">
          Playing a game
        </span>
        <div class="bodyNormal">
          <div v-if="richpresence.largeImageKey" class="assets">
            <img
              v-if="richpresence.largeImageText"
              v-tippy="{ arrow: true }"
              class="assetsLargeImage"
              :content="richpresence.largeImageText"
              :src="largeImageURL || (metadata ? metadata.icon : null ) || (app ? app.img_icon_url : null ) || largeImagePlaceholder"
              :class="richpresence.smallImageKey ? 'maskLargeImage' : ''"
            >
            <img
              v-else
              class="assetsLargeImage"
              :src="largeImageURL || (metadata ? metadata.icon : null ) || (app ? app.img_icon_url : null ) || largeImagePlaceholder"
              :class="richpresence.smallImageKey ? 'maskLargeImage' : ''"
            >
            <img
              v-if="richpresence.smallImageKey && richpresence.smallImageText"
              v-tippy="{ arrow: true }"
              :content="richpresence.smallImageText"
              class="assetsSmallImage"
              :src="smallImageURL || smallImagePlaceholder"
            >
            <img
              v-else-if="richpresence.smallImageKey"
              class="assetsSmallImage"
              :src="smallImageURL || smallImagePlaceholder"
            >
          </div>
          <div class="contentImagesProfile">
            <span class="activityName" :title="gameName">{{ gameName }}</span>
            <div v-if="richpresence.details" :title="richpresence.details" class="textRow">
              {{ richpresence.details }}
            </div>
            <div v-if="richpresence.state" class="textRow">
              <span v-if="richpresence.state" :title="richpresence.state">
                {{ richpresence.state }}
              </span>
              <span v-if="party"> {{ party }}</span>
            </div>
            <!-- <div class="textRow">
              12:09:36 elapsed
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="discord-header">
    <header class="header not-connected">
      NOT CONNECTED
    </header>
  </div>
</template>

<script lang="ts">
const { shell } = window.require('electron');
const CDN_URL = 'https://cdn.discordapp.com';

export default {
  props: {
    user: {
      type: Object,
      default: () => ({
        username: 'Username',
        discriminator: '0000',
        id: '1',
        avatar: null,
        flags: 0
      })
    },
    richpresence: {
      type: Object,
      default: () => null
    },
    app: {
      type: Object,
      default: () => null
    },
    metadata: {
      type: Object,
      default: () => null
    },
    type: {
      type: String,
      default: 'normal'
    },
    largeImageURL: {
      type: String,
      default: ''
    },
    smallImageURL: {
      type: String,
      default: ''
    },
  },
  data() {
    return {
      largeImagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtX5UOthBRDBDdbIgKuIoVSyChdJWaNXB5NIvaNKQpLg4Cq4FBz8Wqw4uzro6uAqC4AeIk6OToouU+L+k0CLWg+N+vLv3uHsHCLUSU82OCUDVLCMRjYjpzKroe0UfutCDAEYkZuqx5GIKbcfXPTx8vQvzrPbn/hz9StZkgEcknmO6YRFvEM9sWjrnfeIgK0gK8TnxuEEXJH7kuuzyG+e8wwLPDBqpxDxxkFjMt7DcwqxgqMTTxCFF1ShfSLuscN7irJYqrHFP/kJ/VltJcp3mMKJYQgxxiJBRQRElWAjTqpFiIkH7kTb+IccfJ5dMriIYORZQhgrJ8YP/we9uzdzUpJvkjwCdL7b9MQr4doF61ba/j227fgJ4n4Errekv14DZT9KrTS10BAS2gYvrpibvAZc7wOCTLhmSI3lpCrkc8H5G35QBBm6B3jW3t8Y+Th+AFHW1fAMcHAJjecpeb/Pu7tbe/j3T6O8HPhZykhBApowAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfkCwYJERUib2GNAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAAxJREFUCNdj+P//PwAF/gL+3MxZ5wAAAABJRU5ErkJggg==',
      smallImagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtX5UOthBRDBDdbIgKuIoVSyChdJWaNXB5NIvaNKQpLg4Cq4FBz8Wqw4uzro6uAqC4AeIk6OToouU+L+k0CLWg+N+vLv3uHsHCLUSU82OCUDVLCMRjYjpzKroe0UfutCDAEYkZuqx5GIKbcfXPTx8vQvzrPbn/hz9StZkgEcknmO6YRFvEM9sWjrnfeIgK0gK8TnxuEEXJH7kuuzyG+e8wwLPDBqpxDxxkFjMt7DcwqxgqMTTxCFF1ShfSLuscN7irJYqrHFP/kJ/VltJcp3mMKJYQgxxiJBRQRElWAjTqpFiIkH7kTb+IccfJ5dMriIYORZQhgrJ8YP/we9uzdzUpJvkjwCdL7b9MQr4doF61ba/j227fgJ4n4Errekv14DZT9KrTS10BAS2gYvrpibvAZc7wOCTLhmSI3lpCrkc8H5G35QBBm6B3jW3t8Y+Th+AFHW1fAMcHAJjecpeb/Pu7tbe/j3T6O8HPhZykhBApowAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfkCwYJESvjDnwmAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAAxJREFUCNdj2LbvBQAEigJdDkvvPAAAAABJRU5ErkJggg=='
    };
  },
  computed: {
    avatarURL() {
      const { id, discriminator, avatar } = this.user;
      let format = 'png';

      if (!avatar)
        return `${CDN_URL}/embed/avatars/${discriminator % 5}.png`;

      if (avatar.startsWith('a_')) format = 'gif';

      return `${CDN_URL}/avatars/${id}/${avatar}.${format}?size=128`;
    },
    gameName() {
      return this.app ? this.app.name : '<unknown>';
    },
    party() {
      return this.richpresence.partySize !== undefined && this.richpresence.partyMax !== undefined ? `(${this.richpresence.partySize} of ${this.richpresence.partyMax})` : '';
    }
  },
  methods: {
    openLink(url: string) {
      shell.openExternal(url);
    }
  }
};
</script>

<style lang="stylus">
@font-face
  font-family Whitney
  font-weight 400
  src url('../assets/fonts/Whitney-400.woff') format('woff')

@font-face
  font-family Whitney
  font-weight 600
  src url('../assets/fonts/Whitney-600.woff') format('woff')

@font-face
  font-family Whitney
  font-weight 700
  src url('../assets/fonts/Whitney-700.woff') format('woff')

.discord-header
  background-color #202225
  font-family Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif
  border-radius 5px
  margin 10px
  filter drop-shadow(4px 4px 4px #0005)
  *
    outline none
  p, small, span
    margin 0
    padding 0
    border 0
    font-weight inherit
    font-style inherit
    font-family inherit
    font-size 100%
    vertical-align baseline
  .header
    display flex
    align-items center
    padding 20px
    &.not-connected
      color #fff
      font-size 18px
      font-weight 600
      text-align center
      justify-content center
    .avatar-wrapper
      margin-right 20px
      position relative
      border-radius 50%
      width 80px
      height 80px
      .svg
        position absolute
      .mask
        pointer-events none
        position relative
        display block
        height 100%
        width auto
      .statusCircle
        pointer-events auto
        fill #43b581
      .avatar
        display block
        width 100%
        height 100%
        object-fit cover
        pointer-events none
      .avatar-img
        display block
        width 100%
        height 100%
    .headerInfo
      flex 1
      min-width 0
      padding-right 16px
      .nameTag
        justify-content flex-start
        align-items center
        overflow hidden
        user-select text
        white-space normal
        word-break break-word
        line-height 20px
        flex-wrap wrap
        display flex
        margin-right 20px
        .discriminator, .username
          white-space normal
          display block
        .username
          color #fff
          font-size 18px
          font-weight 600
          flex 0 1 auto
          white-space nowrap
          text-overflow ellipsis
          overflow hidden
          -webkit-box-flex 0
        .discriminator
          font-size 14px
          color #b9bbbe
          opacity 1
      .profileBadges
        margin-top: 8px
        display flex
    .additionalActionsIcon
      display block
      width 24px
      height 24px
      margin-left 8px
      opacity .6
      color #b9bbbe
  &.playing
    background #7289da
    .header .headerInfo .nameTag .discriminator
      color #fff
      opacity .6
    .header .avatar-wrapper .statusCircle
      fill #fff
    .header .additionalActionsIcon
      color #fff
  .headerFill
    background-color rgba(0,0,0,.05)
    .activity
      padding 20px
      .headerText
        display flex
        color #fff
        font-weight 700
        text-transform uppercase
        margin-bottom 8px
        font-size 12px
        line-height 16px
        vertical-align baseline
      .bodyNormal
        display flex
        align-items center
        color #fff
        .assets
          position relative
          .assetsLargeImage
            -webkit-user-drag none
            border-radius 8px
            display block
            object-fit cover
            width 90px
            height 90px
            &.maskLargeImage
              -webkit-mask url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3e%3cpath d='M90%2c64.7510955 L90%2c5 C90%2c2.23857625 87.7614237%2c-5.07265313e-16 85%2c0 L5%2c0 L5%2c0 C2.23857625%2c5.07265313e-16 -3.38176876e-16%2c2.23857625 0%2c5 L0%2c5 L0%2c85 C3.38176876e-16%2c87.7614237 2.23857625%2c90 5%2c90 L64.7510955%2c90 C62.399336%2c86.9581075 61%2c83.14247 61%2c79 C61%2c69.0588745 69.0588745%2c61 79%2c61 C83.14247%2c61 86.9581075%2c62.399336 90%2c64.7510955 Z'/%3e%3c/svg%3e")
              mask url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3e%3cpath d='M90%2c64.7510955 L90%2c5 C90%2c2.23857625 87.7614237%2c-5.07265313e-16 85%2c0 L5%2c0 L5%2c0 C2.23857625%2c5.07265313e-16 -3.38176876e-16%2c2.23857625 0%2c5 L0%2c5 L0%2c85 C3.38176876e-16%2c87.7614237 2.23857625%2c90 5%2c90 L64.7510955%2c90 C62.399336%2c86.9581075 61%2c83.14247 61%2c79 C61%2c69.0588745 69.0588745%2c61 79%2c61 C83.14247%2c61 86.9581075%2c62.399336 90%2c64.7510955 Z'/%3e%3c/svg%3e")
          .assetsSmallImage
            border-radius 50%
            position absolute
            bottom -4px
            right -4px
            width 30px
            height 30px
          & + .contentImagesProfile
            margin-left 20px
        .contentImagesProfile
          flex 1 1 auto
          .activityName
            font-weight 600
          .textRow
            display block
            font-size 14px
            line-height 18px
            white-space nowrap
            text-overflow ellipsis
            overflow hidden
</style>
