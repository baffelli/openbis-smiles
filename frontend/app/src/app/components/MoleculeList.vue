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



const props = defineProps<{storeId: string, stores: storeDispatcher}>()


const openbis = useOpenbis();
await openbis.populate();


//Initialise stores for collection
const moleculeStore = props.stores.getStore(props.storeId)
const { currentCollection: moleculeCollection, collectionSize: moleculeCollectionSize } = storeToRefs(moleculeStore)




const selectedMolecule = ref<OpenbisObject>(null);
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
    () => {console.log(moleculeCollectionSize)}
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

const selectedCollectionMol = ref<string>(null)
const selectedCollectionProd = ref<string>(null)
</script>


<template>
            <div>
                <button @click="handleAddEntry"><i class="bi bi-plus-square"> </i>Add entry</button>
                <ListView :entries="moleculeCollection" :object-types="openbis?.instance.objectTypes" :size=10
                    :max-size="moleculeCollectionSize" :title="'Molecules'" @select="selectMolecule(moleculeStore)"
                    @page-changed="changePage(moleculeStore)" @sort-changed="sortChanged(moleculeStore)">
                    <template #extra="entry">
                        <MoleculeIcon :entry="entry.entry" :config="molConfig"></MoleculeIcon>
                    </template>
                    <template #actions=entry>
                        <ListItemActions :item="entry.entry" @edit="handleEditEntry">
                        </ListItemActions>
                    </template>
                </ListView>
            </div>
</template>

