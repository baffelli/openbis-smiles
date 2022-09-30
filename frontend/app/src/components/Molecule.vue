<script setup lang="ts">
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, defineProps, defineEmits, computed} from 'vue';
import { storeToRefs} from 'pinia';
import { Molecule as MolInterface, useMolecule } from '@/store/molecule';
import {MappedOpenbisObject, OpenbisObjectConfiguration, expandObject} from './utils';
//import ChemDraw from './ChemDraw.vue';


// const props = defineProps<{name: string, formula: string, smiles: string, cas:string}>();
const emit = defineEmits<{(event: 'change'): string}>()
const props = defineProps<{mol: MolInterface, config: OpenbisObjectConfiguration}>()


const molComp = computed( (): MappedOpenbisObject => expandObject(props.mol, props.config))

</script>



<template>
<form>
    <fieldset v-for="(el, key, index) in molComp">
        <p>
                <label :for="key">{{key}}</label>
                <div @change="$emit('change', key, $event.target.value)">
                    <input :name="key" :value="el.value" v-if="el.dataType === 'string'"/>
                    <input type="checkbox" :name="key" :value="el.value" v-else-if="el.dataType === 'boolean'"/>
                    <input type="date" :name="key" :value="el.value" v-else-if="el.dataType === 'date'"/>
                </div>


        </p> 
            <!-- <legend>Structure</legend>
            <p>
                <label for='chemical-name'>Chemical Formula</label>
                <input id="chemical-name" name="Name" :v-model="name" @change="$emit('change:name', $event.target.value)"/>
            </p>
            <p>
                <label for='chemical-formula'>Chemical Formula</label>
                <input id="chemical-formula" name="Formula" :v-model="formula" @change="$emit('change:formula', $event.target.value)"/>
            </p>
            <p>
                <label for='smiles-output'>SMILES</label>
                <input name="SMILES" id="smiles-output"   :v-model="smiles" @change="$emit('change:smiles', $event.target.value)"/>
            </p>
            <p>
                <label for='cas-number'>CAS Number</label>
                <input name="CAS Number" id="cas-number"   :v-model="cas" @change="$emit('change:cas', $event.target.value)"/>
            </p>
            <p>
                <label for='upload'>Upload CDXML</label>
                <input type="file" id='upload' name='Upload cdxml'>
            </p> -->
    </fieldset>
</form>
</template>