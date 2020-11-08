import Vue from 'vue';
import VueTippy, { TippyComponent } from 'vue-tippy';

// @ts-ignore
import appView from './app.vue';

Vue.config.productionTip = false;
Vue.config.devtools = false;

Vue.use(VueTippy, {
  theme: 'steemcord',
  animation: 'perspective',
});
Vue.component('tippy', TippyComponent);

window.onload = async () => {
  new Vue({
    render: h => h(appView)
  }).$mount('#app');
};