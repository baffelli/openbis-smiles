<template>
  <Suspense>
    <router-view></router-view>
  </Suspense>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { useUser } from './store/login';
import { router } from './router/router';


onBeforeMount(async () => {

  const store = useUser();
  try{
    await store.init();
  }catch(e){
    alert('Openbis not available');
  }
  router.push('main');
})
</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
