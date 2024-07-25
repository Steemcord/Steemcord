<template>
  <div class="steam-header">
    <div class="currentUserContainer" :class="status">
      <svg
        class="statusHeaderGlow"
        width="100%"
        height="132"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id="exampleGradient"
            cx="50%"
            cy="50%"
            r="50%"
            fx="35%"
            fy="30%"
          >
            <stop offset="10%" stop-color="gold" />
            <stop offset="95%" stop-color="green" />
          </radialGradient>
        </defs>
        <ellipse
          cx="5%"
          cy="28%"
          rx="65%"
          ry="60%"
          fill="url(#exampleGradient)"
        />
      </svg>
      <div class="AvatarAndUser">
        <div class="currentUserAvatar">
          <div
            v-if="avatar"
            v-tippy="{ arrow: true }"
            class="avatarHolder"
            content="View Steam Profile"
            @click="openLink(`https://steamcommunity.com/profiles/${steamid}`)"
          >
            <div class="steamavatar_avatarStatus_1Pwr6 avatarStatus" />
            <img
              class="avatar"
              :src="avatar"
              draggable="false"
            >
          </div>
        </div>
        <div class="labelHolder">
          <div class="personanameandstatus_statusAndName_9U-hi">
            <div class="personanameandstatus_playerName_1uxaf">
              {{ username }}
            </div>
            <div class="ContextMenuButton">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="SVGIcon_Button SVGIcon_DownArrowContextMenu"
                data-name="Layer 1"
                viewBox="0 0 128 128"
                x="0px"
                y="0px"
              >
                <polygon
                  points="50 59.49 13.21 22.89 4.74 31.39 50 76.41 95.26 31.39 86.79 22.89 50 59.49"
                />
              </svg>
            </div>
          </div>
          <div class="personanameandstatus_richPresenceContainer_21cNf">
            <div
              class="personanameandstatus_gameName_qvibF personanameandstatus_richPresenceLabel_3Q6g1"
            >
              {{ gamename }}
            </div>
            <div v-if="richpresence && status === 'ingame'" class="personanameandstatus_richPresenceLabel_3Q6g1">
              {{ richpresence }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const { shell } = window.require('electron');

export default {
  props: {
    username: {
      type: String,
      default: 'Username'
    },
    avatar: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'online'
    },
    gamename: {
      type: String,
      default: 'Online'
    },
    richpresence: {
      type: String,
      default: null
    },
    steamid: {
      type: String,
      default: null
    },
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
  font-family 'Motiva Sans'
  font-weight 300
  src url('../assets/fonts/Whitney-400.woff') format('woff')

.steam-header
  background-color #23262c
  overflow hidden
  height 64px
  position relative
  user-select none
  cursor default
  flex-shrink 0
  font-family 'Motiva Sans', Arial, Helvetica, sans-serif
  border-radius 5px
  margin 10px
  filter drop-shadow(4px 4px 4px #0005)
  *
    outline none
  .currentUserContainer
    border-bottom 1px solid rgba(67, 73, 83, 0.5)
    padding-right 24px
    .statusHeaderGlow
      position absolute
      opacity 1
      transition opacity .92s ease-in-out
      pointer-events none
      stop
        transition stop-color 1s ease
        &:first-child
          stop-color rgba(117, 174, 197, 0.3)
        &:last-child
          stop-color rgba(0, 122, 204, 0)
          stop-opacity 0
    .AvatarAndUser
      display flex
      flex-direction row
      padding-left 8px
      padding-top 8px
      padding-bottom 8px
      .currentUserAvatar
        width 48px
        height 48px
        box-shadow 1px 2px 18px rgba(0, 0, 0, 0.3)
        transition-property box-shadow, filter, transform
        transition-duration .24s, .16s
        transition-timing-function ease-in-out
        z-index 100
        position relative
        -webkit-app-region no-drag
        cursor pointer
        border-radius 2px
        &:hover
          transform scale(1.05)
          filter brightness(1.2)
        .avatarHolder
          width 48px
          height 48px
          transform none
          .avatar
            border 1px solid #383c43
            height calc(100% - 2px)
            width calc(100% - 2px)
            box-shadow 2px 2px 8px 1px rgba(0, 0, 0, 0.3)
            transition filter .24s ease-in-out
      .labelHolder
        margin 0px 0px 0px 8px
        min-width 0
        display flex
        flex-shrink 1
        flex-grow 1
        flex-direction column
        justify-content center
        margin-bottom -4px
        margin-right 4px
        .personanameandstatus_statusAndName_9U-hi
          display flex
          flex-direction row
          margin-bottom -4px
          -webkit-app-region no-drag
          width 100%
          .ContextMenuButton
            margin-top -4px
            margin-bottom 4px
            opacity 0.5
            padding-top 2px
            padding-left 2px
            -webkit-app-region no-drag
            width 16px
            height 16px
            margin-left 0px
            transition opacity .1s ease-in-out
            overflow hidden
            flex-shrink 0
            z-index 3
            .SVGIcon_DownArrowContextMenu
              width 12px
              height 12px
              padding-left 4px
              max-width 320px
              max-height 320px
              overflow visible
              fill #ffffff
          .personanameandstatus_playerName_1uxaf
            font-size 15px
            font-family "Motiva Sans", Arial, Helvetica, sans-serif
            font-weight 300
            transition color .94s ease-in-out
            text-shadow 1px 1px 4px #000
            white-space nowrap
            text-overflow ellipsis
            overflow hidden
            min-width: 0
        .personanameandstatus_richPresenceContainer_21cNf
          margin-top 2px
          align-self stretch
          display flex
          flex-direction column
          width calc(100% - 30px)
          .personanameandstatus_richPresenceLabel_3Q6g1
            display: flex;
            flex-direction: row;
            line-height: 12px;
            white-space: nowrap;
            overflow: hidden;
            font-size: 10px;
            margin-top: -1px;
            -webkit-mask: linear-gradient(to right, black calc( 100% - 8px), rgba(0, 0, 0, 0.15) 100%);
            margin-right: -24px;
            margin-top -1px
            margin-bottom 1px
            font-size 12px
            display inline-block
            transition color .94s ease-in-out
            text-shadow 1px 1px 3px #000
            &:not(.personanameandstatus_gameName_qvibF)
              font-size 10px
              margin-top -1px
              margin-bottom 1px
    &.offline .statusHeaderGlow
      opacity 0
    &.online
      .personanameandstatus_playerName_1uxaf
        color #6dcff6
      .personanameandstatus_richPresenceLabel_3Q6g1
        color #4c91ac
      .AvatarAndUser .labelHolder .personanameandstatus_statusAndName_9U-hi .ContextMenuButton .SVGIcon_DownArrowContextMenu
        fill #4c91ac
    &.ingame
      .statusHeaderGlow stop
        &:first-child
          stop-color rgba(140, 188, 84, 0.3)
        &:last-child
          stop-color rgba(140, 188, 84, 0)
          stop-opacity 0
      .AvatarAndUser
        .steamavatar_avatarStatus_1Pwr6
          background linear-gradient(to bottom, #8cd61d 0%, #a1f410 30%, #a1f410 70%, #8cd61d 100%)
        .labelHolder
          .personanameandstatus_statusAndName_9U-hi .ContextMenuButton .SVGIcon_DownArrowContextMenu
            fill #91c257
          .personanameandstatus_richPresenceLabel_3Q6g1
            color #62813b
            &.personanameandstatus_gameName_qvibF
              color #91c257
</style>
