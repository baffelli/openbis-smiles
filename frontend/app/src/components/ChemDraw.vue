<script lang="ts">
enum DrawMode {
    depict,
    nodepict
}
</script>
<script setup lang="ts">

import { ref, onBeforeMount, onMounted, onActivated, getCurrentInstance, watch, defineProps, PropType, withDefaults } from 'vue';
import { Molecule } from '@/store/molecule';


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
    height: "200px",
    id: () => `JSME-${Math.ceil(Math.random() * 100)}`,
    mode: DrawMode.depict,
    options: "",
})




const emit = defineEmits<{ (event: 'structureChanged'): string }>()
console.log(props);
// Attach script
const mol = ref(props.molecule);
const src = ref("../node_modules/jsme-editor/jsme.nocache.js");
const newScript = document.createElement("script");
newScript.setAttribute('src', src.value);
newScript.setAttribute('type', "text/javascript");
document.head.appendChild(newScript);




// On loading window, initialise applet.
// It has horrible side effects
window.jsmeOnLoad = () => {
    console.log("JSME-Editor module loaded")
    const JSA = new (window.JSApplet.JSME as unknown as JSME)(
        props.id,
        props.width,
        props.height,
        {options: props.options}
    );
    JSA.deferredRepaint(); 
    if (mol.value.smiles !== "") {
        JSA.readGenericMolecularInput(mol.value.smiles);
    }

    watch(mol.value,
        (newVal, oldVal) => {
            console.log('new');
            JSA.readGenericMolecularInput(newVal.smiles);
        }
    )
    window.JSA = JSA;

}

function save(){
    const newSmiles = window.JSA.smiles();
    emit('structureChanged', newSmiles);
    }


</script>

<template>
    <legend>Molecule</legend>
    <div :style="{
      outlineOffset: '-.5px',
      textAlign: 'center',
      display: 'inline-block'
    }">
    <table align="center">
        <tr>
            <td :id="props.id"></td>
        </tr>
    </table>
    <button @click="save">Save and Populate</button>
    </div>
    
</template>