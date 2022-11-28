<script setup lang="ts">
import Molecule from "./Molecule.vue"
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, markRaw, toRef, computed } from 'vue';
import { storeToRefs, Store } from 'pinia';
import { useMolecule } from '@/chemical/store/molecule.js/molecule';
import { OpenbisObjectConfiguration, expandObject, reverseMapping, OpenbisCollection, OpenbsInstance, OpenbisObject } from '../openbis/model/utils.jsbis/model/utils'
import ChemDraw from '../../chemical/components/ChemDraw.vue';
import { useOpenbis } from "@/openbis/store/openbis";
import ListView from '../../components/ListView.vue';
import ListItemActions from "../../components/ListItemActions.vue";
import MoleculeIcon from "./MoleculeIcon.vue";
import { Molecule as MoleculeType } from "@/chemical/store/molecule.js/molecule"
import { collectionCreator } from "@/openbis/store/collection"


const molStore = useMolecule();
const { molecule } = storeToRefs(molStore)

const openbis = useOpenbis();
await openbis.populate();




const { instance } = storeToRefs(openbis)



const allColls = openbis.getAllCollections()

//Initialise stores for collection

const moleculeStore = collectionCreator.collectionStore("molecule")
const productStore = collectionCreator.collectionStore("product")
const { currentCollection: moleculeCollection, collectionSize: moleculeCollectionSize } = storeToRefs(moleculeStore)
const { currentCollection: productCollection, collectionSize: productCollectionSize } = storeToRefs(productStore)




const selectedMolecule = ref<OpenbisObject>(null);
const selectedProduct = ref<OpenbisObject>(null);

const pageSize = 10;


const collectionSize = computed(() => openbis.collectionSize);
const editMolecule = ref<boolean>(false)

// Mapp store to form properties
const molConfig = {
    openbisType: 'MOLECULE',
    prefix: 'MOL',
    properties:
    {
        "iupacName": { commonName: 'iupacName', openbisPropertyName: 'MOLECULE.IUPAC_NAME', dataType: 'string' },
        "cas": { commonName: 'cas', openbisPropertyName: 'MOLECULE.CAS', dataType: 'string' },
        "inChi": { commonName: 'inChi', openbisPropertyName: 'MOLECULE.INCHI', dataType: 'string' },
        "smiles": { commonName: 'smiles', openbisPropertyName: 'MOLECULE.SMILES', dataType: 'string' }

    }
} as OpenbisObjectConfiguration<MoleculeType>





// Handle change of any property

async function handleChange(prop: string, val: string) {
    if (Object.keys(molConfig.properties).includes(prop)) {
        await molStore.populate(val, val);
        const props = reverseMapping(molecule.value, molConfig)
        selectedMolecule.value.properties = props
    }
}


async function handleChangedStructure(smiles: string) {
    try {
        await molStore.populate(smiles, 'smiles');
    } catch (e) {
        alert(e);
    }
}

async function onCollectionChange(store: Store, coll: string) {
    await openbis.getCollection(coll, molConfig.openbisType, pageSize)
}


function selectMolecule(selected: OpenbisObject) {
    console.log(selected)
    selectedMolecule.value = selected
}

function selectProduct(selected: OpenbisObject) {
    selectedProduct.value = selected
}

//Handle page change
async function changePage(page: number) {
    console.log("page change")
    await openbis.toPage(page)
}

//Handle sorting
async function sortChanged(fields: string) {
    await openbis.sortCollection([fields])
}

const molCollection = computed(
    () => {
        return moleculeCollection?.value
    }
)

const prodCollection = computed(
    () => {
        return productCollection?.value
    }
)


const childrenCollection = computed(
    () => {
        return { samples: selectedMolecule?.value?.children } as OpenbisCollection
    }
)


async function handleDeleteEntry(item: OpenbisObject) {
    console.log("Editign")

    console.log(item)
}


async function handleEditEntry(item: OpenbisObject) {
    console.log(`Editign ${item}`)
    editMolecule.value = true
}

async function handleSaveMolecule() {
    editMolecule.value = false
}

function handleAddEntry() {
    selectedMolecule.value = {} as OpenbisObject
    editMolecule.value = true
}

</script>

<template>
    <h1>openBIS Chemicals Manager</h1>
    <div>
        Select a collection for molecules
        <select v-model="moleculeCollection"
            @change="onCollectionChange('molecule', moleculeCollection.identifier.identifier)">
            <option disabled value="">Please select collection to display molecules from</option>
            <option v-for="coll in allColls">{{ coll.identifier.identifier }}</option>
        </select>
    </div>
    <div>
        Select a collection for products
        <select v-model="productCollection"
            @change="onCollectionChange('product', productCollection.identifier.identifier)">
            <option disabled value="">Please select collection to display molecules from</option>
            <option v-for="coll in allColls">{{ coll.identifier.identifier }}</option>
        </select>
    </div>


    <div class="container">

        <div class="Collection grid-line">
            <div>
                <button @click="handleAddEntry"><i class="bi bi-plus-square"> </i>Add entry</button>
                <ListView :entries="molCollection" :object-types="openbis?.instance.objectTypes" :size=10
                    :max-size="moleculeCollectionSize" :title="'Molecules'" @select="selectMolecule"
                    @page-changed="changePage" @sort-changed="sortChanged">
                    <template #extra="entry">
                        <MoleculeIcon :entry="entry.entry" :config="molConfig"></MoleculeIcon>
                    </template>
                    <template #actions=entry>
                        <ListItemActions :item="entry.entry" @edit="handleEditEntry">
                        </ListItemActions>
                    </template>
                </ListView>
            </div>
        </div>
        <div class="Products grid-line">
            <ListView :entries="childrenCollection" :object-types="openbis?.instance.objectTypes" :size=5
                :max-size=childrenCollection.totalCount :title="'Products'" @select="selectProduct">
                <h1>Title</h1>
                <template #actions=entry>
                    <ListItemActions :item="entry.entry" @edit="handleEditEntry">
                    </ListItemActions>
                </template>
            </ListView>
        </div>
        <div>
            <Molecule :mol="selectedMolecule" :config="molConfig" @change="handleChange" @save="handleSaveMolecule"
                :edit="editMolecule"></Molecule>
        </div>

    </div>


</template>

<style>
.container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    gap: 0px 0px;
    grid-template-areas:
        "Collection Products Molecule Sketch"
        "Collection Products Molecule Sketch"
        "Collection Products Molecule Sketch";
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