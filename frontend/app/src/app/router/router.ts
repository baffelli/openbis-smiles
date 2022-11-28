import {createRouter, createWebHistory ,  RouteRecordRaw } from 'vue-router'
import {useUser} from '@/openbis/store/login'
import { storeToRefs } from 'pinia';

const routes: Array<RouteRecordRaw> = [
    { 
        path: '/main', name: "main",  component: () => import('@/app/components/MainPage.vue'),  meta: { requiresAuth: true}
    },
    {
        path: '/login', name: "login", component:  () => import('@/app/components/Login.vue'), meta: { requiresAuth: false}
    },
]
  

const router = createRouter({
    history: createWebHistory(),
    routes,
  });



// Routing guard redirecting to login
// if the user is not logged
router.beforeEach((to, from) => {
    const store = useUser();
    const {user, token, loggedIn} = storeToRefs(store)
    if (((to.matched.some((record) => record.meta.requiresAuth)) && !loggedIn.value) && to.name != "login"){
        return {name: "login"}
    }
  }
  );
  


export {router}