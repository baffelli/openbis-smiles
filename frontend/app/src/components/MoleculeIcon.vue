<script setup lang="ts">
import { Molecule } from '@/store/molecule';
import { StructureEditor, StructureView, Molecule as Mol } from 'openchemlib/full'
import { ref, onMounted, onUpdated, computed,onRenderTriggered } from 'vue';
import { expandObject, OpenbisObject, OpenbisObjectConfiguration } from './utils';

const props = defineProps<{ entry: OpenbisObject, config: OpenbisObjectConfiguration }>()
const mol = computed(() => expandObject(props.entry, props.config) as Molecule)
const molRep = computed(() => Mol.fromSmiles(mol.value.smiles))
const canvas = ref()

const done = ref<boolean>(false)


onUpdated(
    () => {
        StructureView.drawMolecule(canvas.value, molRep.value)
        done.value = true
    }
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