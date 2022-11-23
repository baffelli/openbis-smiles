import App from './App.vue'
import {createApp, markRaw } from 'vue'
import piniaInstance from './store/store'
import {router} from "./router/router"
import 'bootstrap-icons/font/bootstrap-icons.css'

// import 'bootstrap-icons'

console.log('App')
// Load openbis V3 API

const app = createApp(App).use(piniaInstance).use(router).mount('#app');
