<script setup lang="ts">
import Molecule from "@/chemical/components/Molecule.vue"
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, markRaw, toRef, computed } from 'vue';
import { storeToRefs, Store } from 'pinia';
import { useMolecule } from '@/chemical/store/molecule';
import { OpenbisObjectConfiguration, expandObject, reverseMapping, OpenbisCollection, OpenbsInstance, OpenbisObject } from '@/openbis/model/utils'
import ChemDraw from '@/chemical/components/ChemDraw.vue';
import { useOpenbis } from "@/openbis/store/openbis";
import ListView from '@/app/components/ListView.vue';
import ListItemActions from "@/app/components/ListItemActions.vue";
import MoleculeIcon from "@/chemical/components/MoleculeIcon.vue";
import { Molecule as MoleculeType } from "@/chemical/model/Chemicals"
import { collectionCreator, storeDispatcher, OpenbisCollectionStore } from "@/openbis/store/collection"
import CollectionView from "@/openbis/components/CollectionView.vue";




const openbis = useOpenbis();
await openbis.populate();


const { instance } = storeToRefs(openbis)



const allColls = openbis.getAllCollections()

//Initialise stores for collection
const collectionDispatcher = storeDispatcher.createFromId(["molecule", "product"])
const moleculeStore = collectionDispatcher.getStore("molecule")
const productStore = collectionDispatcher.getStore("product")
const { currentCollection: moleculeCollection, collectionSize: moleculeCollectionSize } = storeToRefs(moleculeStore)
const { currentCollection: productCollection, collectionSize: productCollectionSize } = storeToRefs(productStore)




const selectedMolecule = ref<OpenbisObject>(null);
const selectedProduct = ref<OpenbisObject>(null);

const pageSize = 10;


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

async function onCollectionChange(store: OpenbisCollectionStore, coll: string, objectType: string) {
    await store.getCollection(coll, objectType, pageSize)
}


function selectMolecule(selected: OpenbisObject) {
    console.log(selected)
    selectedMolecule.value = selected
}

function selectProduct(selected: OpenbisObject) {
    selectedProduct.value = selected
}

//Handle page change
async function changePage(store: OpenbisCollectionStore, page: number) {
    console.log("page change")
    await store.toPage(page)
}

//Handle sorting
async function sortChanged(store: OpenbisCollectionStore, fields: string) {
    await store.sortCollection([fields])
}

// const molCollection = computed(
//     () => {
//         return moleculeCollection?.value
//     }
// )

// const prodCollection = computed(
//     () => {
//         return productCollection?.value
//     }
// )


const childrenCollection = computed(
    () => {
        return { samples: selectedMolecule?.value?.children } as OpenbisCollection
    }
)



const a = computed(
    () => { console.log(moleculeCollectionSize) }
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

const selectedCollectionMol = ref<string>("")
const selectedCollectionProd = ref<string>(null)
</script>


<template>





    <div class="container">
        <header>
            <h1>openBIS Chemicals Manager</h1>
            <div class="selector">
                <div>
                    Select a collection for molecules
                    <select v-model="selectedCollectionMol"
                        @change="onCollectionChange(moleculeStore, selectedCollectionMol, 'MOLECULE')">
                        <option disabled value="">Please select collection to display molecules from</option>
                        <option v-for="coll in allColls">{{ coll.identifier.identifier }}</option>
                    </select>
                </div>
                <div>
                    Select a collection for products
                    <select v-model="selectedCollectionProd"
                        @change="onCollectionChange(productStore, selectedCollectionProd, 'PRODUCT')">
                        <option disabled value="">Please select collection to display molecules from</option>
                        <option v-for="coll in allColls">{{ coll.identifier.identifier }}</option>
                    </select>
                </div>
            </div>
        </header>
        <section id="molecule">
            <CollectionView :store-id="'molecule'" :collection-identifier="selectedCollectionMol"
                :stores="collectionDispatcher" :title="'Molecules'" :size="10" :object-type="molConfig.openbisType">
            </CollectionView>
        </section>
        <section id="products">
            <CollectionView :store-id="'product'" :collection-identifier="selectedCollectionProd"
                :stores="collectionDispatcher" :title="'Products'" :size="10" :object-type="'PRODUCT'">
            </CollectionView>
        </section>
        <!-- <div class="Collection grid-line">
            <div>
                <button @click="handleAddEntry"><i class="bi bi-plus-square"> </i>Add entry</button>
                <ListView :entries="moleculeCollection" :object-types="openbis?.instance.objectTypes" :size=10
                    :max-size="moleculeCollectionSize" :title="'Molecules'" @select="(el) => selectMolecule(el)"
                    @page-changed="(ev) => changePage(moleculeStore, ev)" @sort-changed="sortChanged(moleculeStore)">
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
        </div> -->

    </div>


</template>

<style>



.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 0px 0px;
    grid-template-areas:
        "Header Header"
        "Molecule Product ";
    justify-items: top;
    align-items: top;
    overflow-x: auto;
    gap: 0.6%;
}

.container > .selector {
    display: table-row;
}

.container > .selector > .div {
    display: table-cell;
}

:root {
    --border: 0.1pc solid #000
}

.container > section {
    padding: 1%;
    border-left: var(--border);
    border-right: var(--border);
    border-top: var(--border);
    border-bottom: var(--border);
    border-spacing: 5pc;
    border-radius: 0.5%;
}

.container > header {
    grid-area: Header;
}

.container > section > #molecule {
    grid-area: Molecule;
}

.container > section > #product {
    grid-area: Product;
}
</style>