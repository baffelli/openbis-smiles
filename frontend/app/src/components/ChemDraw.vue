<script lang="ts">

enum DrawMode {
    depict,
    nodepict

}


</script>
<script setup lang="ts">

import { ref, onBeforeMount, onMounted, onBeforeUpdate, onActivated, getCurrentInstance, watch, defineProps, PropType, withDefaults, computed } from 'vue';
import { Molecule } from '@/store/molecule';
import { StructureEditor, StructureView, Molecule as Mol } from 'openchemlib/full'


interface Props {
    width?: string,
    height?: string,
    id?: string,
    options?: string,
    mode?: DrawMode,
    molecule: Molecule | null,
    show: boolean
}





const props = withDefaults(defineProps<Props>(), {
    width: "200px",
    height: "400px",
    id: () => `molecule-${Math.ceil(Math.random() * 100)}`,
    mode: DrawMode.depict,
    options: "",
    show: true
})


const emit = defineEmits<{ (event: 'structureChanged', smiles: string): string }>()
// Attach script
const mol = ref(props.molecule);
const viewer = ref(null);
const moleculeEditor = ref<StructureEditor>(null)

//Representation of molecule
const molRep = computed(()=> Mol.fromSmiles(mol.value.smiles))

onMounted(() => {
        const ed = StructureEditor.createSVGEditor(props.id, 1);
        ed.setSmiles(molRep.value.toSmiles());
        moleculeEditor.value = ed;
    
})




function populate() {
    const newSmiles = moleculeEditor.value.getSmiles();
    emit('structureChanged', newSmiles);
}


function load() {
    const newSmiles = moleculeEditor.value.getSmiles();
    emit('structureChanged', newSmiles);
}

async function save() {
    moleculeEditor.value.getMolFileV3();
    const opts = {
        types: [{
            description: 'Text file',
            accept: { 'text/plain': ['.txt'] },
        }],
    };
    return await (<any>document).showSaveFilePicker(opts);
}


</script>

<template>
    <div>
        <h2>Molecule Sketcher</h2>
        <div :id="props.id" ref="viewer"
            :style="{width:width,height:height,display:'block','margin-left':'auto','margin-right':'auto'}"
            is-fragment="false">
            <button @click="populate"><i class="bi bi-save"></i> Generate from sketch</button>
            <button @click="load">Load .mol</button>
            <button class="btn"><i class="bi bi-download"></i> Download</button>
        </div>
    </div>
</template>

<style>
.modal-enter-from {
    opacity: 0;
}

.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
}
</style>