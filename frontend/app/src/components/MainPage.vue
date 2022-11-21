<script setup lang="ts">
import Molecule from "./Molecule.vue"
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, markRaw, toRef, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMolecule } from '@/store/molecule';
import { OpenbisObjectConfiguration, expandObject, OpenbisCollection, OpenbsInstance } from './utils'
import ChemDraw from './ChemDraw.vue';
import { useOpenbis } from "@/store/openbis";
import ListView from './ListView.vue';
import MoleculeIcon from "./MoleculeIcon.vue";

const molStore = useMolecule();
const mol = storeToRefs(molStore)

const openbis = useOpenbis();
const {currentCollection, instance} = storeToRefs(openbis)
await openbis.populate();
const allColls = openbis.getAllCollections()
const selectedCollection = ref<string>(null);


// Mapp store to form properties
const molConfig = {
    openbisType: 'MOLECULE',
    properties: [
        { commonName: 'iupacName', openbisPropertyName: 'MOLECULE.IUPAC_NAME', dataType: 'string' },
        { commonName: 'cas', openbisPropertyName: 'MOLECULE.CAS', dataType: 'string' },
        { commonName: 'inChi', openbisPropertyName: 'MOLECULE.INCHI', dataType: 'string' },
        { commonName: 'smiles', openbisPropertyName: 'MOLECULE.SMILES', dataType: 'string' }
    ]

} as OpenbisObjectConfiguration


const drawMode = ref(true);

//Get collection of molecules
const molCollection = computed(
    () =>
    {
        const samples = currentCollection.value.samples
        const res = samples.filter((it) => {
            it.code.startsWith("PROD")
        })
        //console.log(res)
        return currentCollection.value
        // return {samples: res} as OpenbisCollection
    }  
    )


// Handle change of any property

async function handleChange(prop: string, val: object) {
    if (['smiles', 'cas', 'name', 'iupacName', 'formula'].includes(prop)) {
        await molStore.populate(val, val);
        //console.log(mol);
    }
}


async function handleChangedStructure(smiles: string) {
    try {
        await molStore.populate(smiles, 'smiles');
    } catch (e) {
        alert(e);
    }
}

async function onCollectionChange() {
    await openbis.getCollection(selectedCollection.value)
}

</script>

<template>
    <h1>openBIS Chemicals Manager</h1>
    <div class="container">

        <div class="Collection grid-line">
            Select a collection
            <select v-model="selectedCollection" @change="onCollectionChange">
                <option disabled value="">Please select collection to display</option>
                <option v-for="coll in allColls">{{coll.identifier.identifier}}</option>
            </select>
            <div>
                <ListView :entries="molCollection" :object-types="openbis?.instance.objectTypes" :size=5 v-slot="entry"><MoleculeIcon :entry="entry.entry" :config="molConfig"></MoleculeIcon></ListView>
            </div>
        </div>
        <div class="Molecule grid-line">
            <!-- <div>
                <Molecule :mol="mol" :config="molConfig" @change="handleChange"></Molecule>
            </div> -->
            <button>Save to openBIS</button>
        </div>
        <!-- <div class="Sketch grid-line">
            <div>
                <ChemDraw width="500px" height="500px" :molecule="mol" :show="drawMode"
                    @structure-changed="handleChangedStructure">
                </ChemDraw>
            </div>
        </div> -->
    </div>


</template>

<style>
.container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    gap: 0px 0px;
    grid-template-areas:
        "Collection Molecule Sketch"
        "Collection Molecule Sketch"
        "Collection Molecule Sketch";
    justify-items: stretch;
    gap: 0.6%;
}

:root {
    --border: 0.1pc solid #000
}

.grid-line {

    padding: 1%;
    border-left: var(--border);
    border-right: var(--border);
    border-top: var(--border);
    border-bottom: var(--border);
    border-spacing: 5pc;
    border-radius: 0.5%;
}

.Molecule {
    grid-area: Molecule;
}

.Collection {
    grid-area: Collection;
}

.Sketch {
    grid-area: Sketch;
}
</style>