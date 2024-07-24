import Vue from 'vue';
import VueRouter from 'vue-router';
import VirtualList from 'vue-virtual-scroll-list';
import VueTippy, { TippyComponent } from 'vue-tippy';
import VModal from 'vue-js-modal';


// @ts-ignore
import appView from './app.vue';
// @ts-ignore
import settings from './settings.vue';
// @ts-ignore
import about from './about.vue';
// @ts-ignore
import gameList from './games.vue';
// @ts-ignore
import developer from './developer.vue';
// @ts-ignore
import presenceList from './presences.vue';
// @ts-ignore
import home from './home.vue';

Vue.config.productionTip = false;
Vue.config.devtools = false;

Vue.use(VueRouter);
Vue.component('v-scroller', VirtualList);
// @ts-ignore
Vue.use(VueTippy, {
  theme: 'steemcord',
  animation: 'perspective',
});
Vue.component('tippy', TippyComponent);
Vue.use(VModal, {
  dynamicDefaults: {
    height: 'auto'
  }
});

window.onload = async () => {
  new Vue({
    render: h => h(appView),
    router: new VueRouter({
      routes: [
        { path: '*', redirect: '/home' },
        { path: '/home', component: home },
        { path: '/settings', component: settings },
        { path: '/about', component: about },
        { path: '/games', component: gameList },
        { path: '/presences', component: presenceList },
        { path: '/dev', component: developer }
      ]
    })
  }).$mount('#app');
};