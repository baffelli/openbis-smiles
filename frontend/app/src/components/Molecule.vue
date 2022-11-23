<script setup lang="ts">
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, defineProps, defineEmits, computed} from 'vue';
import { storeToRefs} from 'pinia';
import { Molecule as MolInterface, useMolecule } from '@/store/molecule';
import {MappedOpenbisObject, OpenbisObjectConfiguration, expandObject} from './utils';
//import ChemDraw from './ChemDraw.vue';


const emit = defineEmits<{(event: 'change'): string}>()
const props = defineProps<{mol: MolInterface, config: OpenbisObjectConfiguration}>()


const molComp = computed( (): MappedOpenbisObject => expandObject(props.mol, props.config))

</script>



<template>
<form>
    <h2>Molecule properties</h2>
    <fieldset v-for="(el, key, index) in molComp">
        <p>
                <label :for="key">{{key}}</label>
                <div @change="$emit('change', key, $event.target.value)">
                    <input :name="key" :value="el.value" v-if="el.dataType === 'string'"/>
                    <input type="checkbox" :name="key" :value="el.value" v-else-if="el.dataType === 'boolean'"/>
                    <input type="date" :name="key" :value="el.value" v-else-if="el.dataType === 'date'"/>
                </div>


        </p> 
    </fieldset>
</form>
</template>