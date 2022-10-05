<script lang="ts">

enum DrawMode {
    depict,
    nodepict

}


</script>
<script setup lang="ts">

import { ref, onBeforeMount, onMounted, onBeforeUpdate, onActivated, getCurrentInstance, watch, defineProps, PropType, withDefaults } from 'vue';
import { Molecule } from '@/store/molecule';
import {StructureEditor,  } from 'openchemlib/full'


interface Props {
    width?: string,
    height?: string,
    id?: string,
    options?: string,
    mode?: DrawMode,
    molecule: Molecule | null,
}


const props = withDefaults(defineProps<Props>(), {
    width: "200px",
    height: "400px",
    id: () => `molecule-${Math.ceil(Math.random() * 100)}`,
    mode: DrawMode.depict,
    options: "",
})


const emit = defineEmits<{ (event: 'structureChanged', smiles: string): string }>()
console.log(props);
// Attach script
const mol = ref(props.molecule);
// //const src = ref("../node_modules/jsme-editor/jsme.nocache.js");
// const src = '../node_modules/kekule/dist/kekule.js'
// const newScript = document.createElement("script");
// newScript.setAttribute('src', src);
// newScript.setAttribute('type', "module");
// document.head.appendChild(newScript);

const viewer = ref(null);
const editor = ref<StructureEditor>(null)

onMounted(() => {
    const ed = StructureEditor.createSVGEditor(props.id, 1)
    ed.setSmiles(props.molecule.smiles);
    editor.value = ed;
})




function populate(){
    const newSmiles = editor.value.getSmiles();
    emit('structureChanged', newSmiles);
}


function load(){
    const newSmiles = editor.value.getSmiles();
    emit('structureChanged', newSmiles);
}

async function save(){
    editor.value.getMolFileV3();
    const opts = {
    types: [{
      description: 'Text file',
      accept: {'text/plain': ['.txt']},
    }],
  };
  return await (<any>document).showSaveFilePicker(opts);
}


</script>

<template>
    <div>
        <legend>Molecule</legend>
        <div :id="props.id" ref="viewer" :style="{width:width,height:height,display:'block','margin-left':'auto','margin-right':'auto'}" is-fragment="false"></div>
        <button @click="populate"><i class="bi bi-save"></i> Generate from sketch</button>
        <button @click="load">Load .mol</button>
        <button class="btn"><i class="bi bi-download"></i> Download</button>

    </div>
</template>