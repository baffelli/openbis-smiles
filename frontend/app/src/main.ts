import App from './App.vue'
import {createApp, markRaw } from 'vue'
import piniaInstance from './store/store'
import {router} from "./router/router"
// import 'bootstrap-icons'

console.log('App')
const app = createApp(App).use(piniaInstance).use(router).mount('#app');
