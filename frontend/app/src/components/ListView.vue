<script setup lang="ts">
import { propsToAttrMap } from '@vue/shared';
import { ref, onBeforeMount, onMounted, onUpdated, onRenderTriggered, onBeforeUpdate, onActivated, getCurrentInstance, watch, computed, defineProps, PropType, withDefaults, reactive } from 'vue';
import Paginate from 'vuejs-paginate-next'
import { OpenbisCollection, OpenbisObject, OpenbisObjectType } from './utils'

const props = defineProps<{ entries: OpenbisCollection | null, objectTypes: OpenbisObjectType[], maxSize: number | null, size: number, title: String }>()
const pageNumber = ref<number>(0);

const selectedElement = ref<OpenbisObject>(null)
const emit = defineEmits<{ 
  (e: 'select', id: OpenbisObject): void,
  (e: 'pageChanged', to: Number): void,
  (e: 'sortChanged', field: String): void
 }>()



const samples = computed( () => props.entries?.samples)
const size = computed( () => props.size )


const pageCount = computed(
  () => {
    const l = props.maxSize
    const s = size.value
    return Math.ceil(l / s) ?? 1;
  }
)

function handleSelected(el: OpenbisObject) {
  emit('select', el)
  selectedElement.value = el
}

function nextPage() {
  pageNumber.value = pageNumber.value + 1
}

function prevPage() {
  pageNumber.value = pageNumber.value - 1
}

function toPage(page: number) {
  pageNumber.value = page
  emit('pageChanged', page)
  
}

const paginatedEntries = computed(
  () => {
    const start = pageNumber.value * size.value;
    const end = start + size.value;
    return samples.value;
  }
)


const allObjectProperties = computed(() => {
  const allProps = paginatedEntries?.value?.flatMap((sample) => {
    return Object.keys(sample.properties)
  }
  )
  const propNames = new Set(allProps)
  return propNames
}
)


</script>

<template>
  <div>
    <h2>{{ props.title }}</h2>
    <div v-if="props.entries">
      <table class="table">
        <thead>
          <tr>
            <th>Extra</th>
            <th>Code</th>
            <th v-for="prop in allObjectProperties">
              {{ prop }}
              <div @click="$emit('sortChanged', prop)"><i class="bi bi-sort-alpha-down"></i></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in paginatedEntries" @click="handleSelected(entry)"
            :class="{ 'highlight': (entry == selectedElement) }">
            <td>
              <!-- This slot will be used to render the molecule-->
              <slot name="extra" :entry="entry"></slot>
            
            </td>
            <td>{{ entry.code }}</td>
            <td v-for="prop in entry.properties">{{ prop }}</td>
            <td @click.prevent>
              <slot name="actions" :entry="entry"></slot>
            </td>
           
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <paginate :page-count="pageCount" :click-handler="toPage" :container-class="'pagination'" :page-class="'page-item'">
  </paginate>


</template>


<style>
ul.pagination li {
  display: inline;

}

.pagination li.page-item.active {
  background-color: lightseagreen
}

.pagination a:hover:not(.active) {
  background-color: #ddd;
}


.pagination a {
  color: black;
  float: center;
  padding: 8px 16px;
  text-decoration: none;
}




.table tbody tr {
  display: table-row;
  margin-bottom: 5px;

}

tbody .highlight {
  background-color: lightgrey
}

.table tbody td {
  overflow: hidden;
  text-align: center;
}
</style>