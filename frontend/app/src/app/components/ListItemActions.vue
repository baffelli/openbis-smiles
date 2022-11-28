<script setup lang="ts">
import { ref, onBeforeMount, onMounted, onUpdated, onRenderTriggered, onBeforeUpdate, onActivated, getCurrentInstance, watch, computed, defineProps, PropType, withDefaults, reactive } from 'vue';
import { OpenbisEntity } from '../openbis/model/utils.jsbis/model/utils';
const props = defineProps<{ item: OpenbisEntity | null}>()
const emit = defineEmits<{ 
  (e: 'delete', id: OpenbisEntity): void,
  (e: 'edit', to: OpenbisEntity): void,
  (e: 'addChild', id: OpenbisEntity): void
 }>()

</script>

<template>
    <button @click="$emit('delete', item)"> 
        <i class="bi bi-trash2"></i> Delete
    </button>
    <button @click="$emit('addChild', item)"> 
        <i class="bi bi-diagram-2"></i> Add children
    </button>
    <button @click="$emit('edit', item)">
        <i class="bi bi-pen"></i> Edit
    </button>
</template>


<style>
/* Tooltip container */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
}

/* Tooltip text */
.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;
 
  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
}

</style>



