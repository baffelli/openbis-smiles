<script setup lang="ts">
import { ref, onBeforeMount, onMounted, onUpdated, onRenderTriggered, onBeforeUpdate, onActivated, getCurrentInstance, watch, computed, defineProps, PropType, withDefaults } from 'vue';
import Paginate from 'vuejs-paginate-next'
import { OpenbisCollection, OpenbisObject, OpenbisObjectType } from './utils'

const props = defineProps<{ entries: OpenbisCollection | null, objectTypes: OpenbisObjectType[], size: number }>()
const pageNumber = ref<number>(0);

const pageCount = computed(
  () => {
    const l = props?.entries?.samples?.length,
      s = props.size;
    return Math.ceil(l / s) ?? 1;
  }
)

function nextPage() {
  pageNumber.value = pageNumber.value + 1
}

function prevPage() {
  pageNumber.value = pageNumber.value - 1
}

function toPage(page: number) {
  pageNumber.value = page
}

const paginatedEntries = computed(
  () => {
    const start = pageNumber.value * props.size;
    const end = start + props.size;
    return props?.entries?.samples?.slice(start, end);
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
    <h2>Inventory</h2>
    <div v-if="props.entries">
      <table class="table">
        <thead>
          <tr>
            <th>Extra</th>
            <th>Code</th>
            <th v-for="prop in allObjectProperties">{{ prop }}</th>
          </tr>

        </thead>
        <tbody>
          <tr v-for="entry in paginatedEntries">
            <!-- <th scope="row"></th> -->
            <td>
              <!-- This slot will be used to render the molecule-->
              <slot :entry="entry"></slot>
            </td>
            <td>{{ entry.code }}</td>
            <td v-for="prop in entry.properties">{{ prop }}</td>
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




/* .table thead {
  display: flex;
  flex-direction: column;
}

.table tr th {
  font-weight: bold;
  text-align: center;
} */


.table tbody tr {
  display: table-row;
  margin-bottom: 5px;

}


.table tbody td {
  overflow: hidden;
  text-align: center;
}
</style>