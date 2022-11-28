<script setup lang="ts">
    import { useRoute, useRouter} from 'vue-router';
    import { Ref, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import {useUser} from '@/openbis/store/login'
    const userStore = useUser();
    const router = useRouter();

    const {user, token, loggedIn} = storeToRefs(userStore)
    const password = ref('');
    // When logged in, go to main page
    async function onSubmit(){
        await userStore.login(user.value, password.value)
        router.push('main')
    }
    console.log('loggedin');
</script>


<template>
    <div class="login" @submit.prevent="onSubmit">
        <form novalidate>
            <h3>Sign in to your openbis instance</h3>
            <div class="row">
                <label for="user">Username</label>
                <input type="text" v-model="user" id="user" />
            </div>
            <div class="row">
                <label for="password">Password</label>
                <input type="password" v-model="password" id="password" />
            </div>
            <div class="row-btn">
                <button type="submit" class="btn btn-dark btn-lg btn-block" @click="onSubmit">Sign In</button>
            </div>
        </form>
    </div>
</template>

<style>

    div.form
    {
        display: block;
        text-align: center;
    }
    
    label {
        width:180px;
        clear:left;
        text-align:right;
        padding-right:10px;
    }
    
    input, label {
        float:left;
    }
    
    form
    {
        display: inline-block;
        margin-left: auto;
        margin-right: auto;
        text-align: left;
    }
    
    div.form .row-btn{
      display: inline-block;
    }
    
    
    </style>