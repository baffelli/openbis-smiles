<script setup lang="ts">

import ListView from '@/app/components/ListView.vue';
import { storeToRefs } from 'pinia';
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, defineProps, defineEmits, computed } from 'vue';
import { OpenbisObjectConfiguration } from '../model/utils';
import { storeDispatcher } from '../store/collection';

const props = withDefaults(defineProps<{ storeId: string, collectionIdentifier: string, stores: storeDispatcher, size: number, title: String, objectType: string }>(), { size: 10 })

console.log(props)

const currentStore = props?.stores?.getStore(props.storeId)

const { currentCollection, collectionSize } = storeToRefs(currentStore)

const coll = computed(() => currentCollection.value)
const maxSize = computed(() => { currentCollection.value.totalCount ?? 1 })
async function pageChange(ev: number) {
    await currentStore.toPage(ev)

}
const a = computed(
    async () => await currentStore.getCollection(props.collectionIdentifier, props.objectType, props.size)
)


</script>


<template>
    <div>
        <ListView :entries="coll" :size=size :max-size="maxSize" :title="title" @page-changed="pageChange"
            @sort-changed="async (ev) => await currentStore.sortCollection(ev)">
        </ListView>
    </div>


</template>