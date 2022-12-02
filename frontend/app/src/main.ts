import App from './app/components/App.vue'
import {createApp, markRaw } from 'vue'
import piniaInstance from './app/helpers/store'
import {router} from "./app/router/router"
import 'bootstrap-icons/font/bootstrap-icons.css'


console.log('App')

const app = createApp(App).use(piniaInstance).use(router).mount('#app');
