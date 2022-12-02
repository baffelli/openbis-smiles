<script setup lang="ts">
import { ref, onBeforeMount, onMounted, getCurrentInstance, watch, defineProps, defineEmits, computed } from 'vue';
import { MappedOpenbisObject, OpenbisObjectConfiguration, expandObject, OpenbisObject } from '@/openbis/model/utils';
import { VueFinalModal } from "vue-final-modal"

import {Molecule as MolInterface, InChI} from "@/chemical/model/Chemicals"


const emit = defineEmits<{ (event: 'change'): string, (event: 'save'): string }>()
const props = defineProps<{ mol: OpenbisObject | null, config: OpenbisObjectConfiguration<MolInterface>, edit: boolean }>()


const molComp = computed(
    () => props.mol ? expandObject(props?.mol, props?.config) : {} as MolInterface
)


const inChi = computed(
    {
        get() {
            return InChI.fromInchi(molComp.value.inChi)
        },
        set(newVal) {
            console.log("cis")
            return newVal
        }
    }
)
</script>



<template>
    <vue-final-modal v-model="props.edit" classes="modal-container" content-class="modal-content">
        <div>
            <form>
                <h2>Properties for {{ mol?.code }}</h2>
                <fieldset v-for="(el, key, index) in molComp">
                    <p>

                    <div @change="$emit('change', key, $event.target?.value)">
                        <label :for="key">{{ key }}</label>
                        <!-- <input :name="key" v-model="el.value" v-if="el.dataType === 'string'" />
                        <input type="checkbox" :name="key" v-model="el.value" v-else-if="el.dataType === 'boolean'" />
                        <input type="date" :name="key" v-model="el.value" v-else-if="el.dataType === 'date'" /> -->
                        <!-- <input type="string" :name="key" :value="el.value"  v-if="el.dataType === 'string'"/> -->
                        <input type="string" :name="key" :value="el" :v-model="el"/>
                    </div>
                    </p>
                </fieldset>
                <button @click="$emit('save')" @submit.prevent type="button">
                    <i class="bi bi-save2"></i> Save
                </button>
            </form>

        </div>

    </vue-final-modal>

</template>


<style scoped>
::v-deep .modal-content {
    display: inline-block;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    background: #fff;
}

.modal__title {
    font-size: 1.5rem;
    font-weight: 700;
}
</style>

<style scoped>
.dark-mode div::v-deep .modal-content {
    border-color: #2d3748;
    background-color: #1a202c;
}
</style>
