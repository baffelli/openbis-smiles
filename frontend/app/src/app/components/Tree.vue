<script setup lang="ts">
import { ref, onBeforeMount, onMounted, onBeforeUpdate, onActivated, getCurrentInstance, watch, defineProps, PropType, withDefaults } from 'vue';

import { OpenbisTree } from '../openbis/model/utils.jsbis/model/utils'

defineProps<{ entries: OpenbisTree }>()

</script>
    
<template>
    <table class="table table-striped">
        <thead>
            <tr>
                <th>#</th>
                <th>2018</th>
                <th>2017</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(entry,i) in props.entries" :key="i">
                <th scope="row">{{ ??? }}</th> //Month
                <td>{{ ??? }}</td> //currentYear.Sale
            </tr>
        </tbody>
    </table>
</template>