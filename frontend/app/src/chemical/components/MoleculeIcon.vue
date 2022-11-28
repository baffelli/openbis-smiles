<script setup lang="ts">
import { Molecule } from '@/chemical/model/Chemicals';
import { StructureEditor, StructureView, Molecule as Mol } from 'openchemlib/full'
import { ref, onMounted, onUpdated, computed,onRenderTriggered } from 'vue';
import { expandObject, OpenbisObject, OpenbisObjectConfiguration } from '@/openbis/model/utils';

const props = defineProps<{ entry: OpenbisObject, config: OpenbisObjectConfiguration<Molecule> }>()
const mol = computed(() => expandObject(props.entry, props.config) as Molecule)
const molRep = computed(() => Mol.fromSmiles(mol.value.smiles))
const canvas = ref()

const done = ref<boolean>(false)

function redraw(){
    StructureView.drawMolecule(canvas.value, molRep.value)
    done.value = true
}

onMounted(
    () => redraw()
)
onUpdated(
    () => redraw()
)
</script>

<template>
    
    <div>
        <h1 v-if="!done">Loading</h1>
        <canvas ref="canvas"></canvas>
    </div>
</template>

<style>
    .canvas {
        border: black 3px solid;
    }
</style>