<script setup lang="ts">
import Molecule from "./Molecule.vue"
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, markRaw, toRef, computed } from 'vue';
import { storeToRefs} from 'pinia';
import {useMolecule } from '@/store/molecule';
import {OpenbisObjectConfiguration, expandObject} from './utils'
import ChemDraw from './ChemDraw.vue';

const molStore = useMolecule();
const mol = storeToRefs(molStore)

// Mapp store to form properties
const molConfig = {
    openbisType: 'MOLECULE',
    properties: [
        {commonName:'name', openbisPropertyName: 'molecule.name', dataType: 'string'},
        {commonName:'iupacName', openbisPropertyName: 'molecule.iupac', dataType: 'string'},
        {commonName:'formula', openbisPropertyName: 'molecule.formula', dataType: 'string'},
        {commonName:'cas', openbisPropertyName: 'molecule.cas', dataType: 'string'},
        {commonName:'smiles', openbisPropertyName: 'molecule.smiles', dataType: 'string'},
        {commonName:'hazardous', openbisPropertyName: 'molecule.hazardous', dataType: 'boolean'},
        {commonName:'supplier', openbisPropertyName: 'molecule.supplier', dataType: 'string'},
        {commonName:'synthBy', openbisPropertyName: 'molecule.synthby', dataType: 'string'},
        {commonName:'receivingDate', openbisPropertyName: 'molecule.received', dataType: 'date'},
    ]
    
} as OpenbisObjectConfiguration


//const mapped = expandObject(mol, molConfig)

// Handle change of any property

async function handleChange(prop: string, val: object){
    if(['smiles', 'cas', 'name', 'iupacName', 'formula'].includes(prop)){
        await molStore.populate(val, val);
        console.log(mol);
    }
}


async function handleChangedStructure(smiles: string){
    try{
        await molStore.populate(smiles, 'smiles');
    }catch(e){
        alert(e);
    }
}

</script>

<template>
    <Molecule :mol="mol" :config="molConfig" @change="handleChange"></Molecule>
    <div>
        <ChemDraw width="1500px" height="300px" :molecule="mol" @structure-changed="handleChangedStructure"></ChemDraw>
    </div>
    <div id="molcanvas"></div>

</template>