<template>
  <table class="v-table">
    <tbody>
      <tr
        v-for="(item, index) in propValue.data"
        :key="index"
        :class="{
          stripe: propValue.stripe && index % 2,
          bold: propValue.thBold && index === 0,
        }"
      >
        <td v-for="(e, i) in item" :key="i">{{ e }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import request from '@/utils/request'
import type { Component, RequestConfig } from '@/types'

interface TablePropValue {
  data: string[][]
  stripe: boolean
  thBold: boolean
}

interface Props {
  propValue: TablePropValue
  request?: RequestConfig
  element: Component
}

const props = defineProps<Props>()

const cancelRequest = ref<(() => void) | null>(null)

onMounted(() => {
  if (props.request) {
    cancelRequest.value = request(props.request, props.propValue, 'data')
  }
})

onBeforeUnmount(() => {
  if (props.request && cancelRequest.value) {
    cancelRequest.value()
  }
})
</script>

<style lang="scss" scoped>
.v-table {
  border-collapse: collapse;
  table-layout: fixed;
  word-break: break-all;
  word-wrap: break-word;

  td {
    border: 1px solid #ebeef5;
    height: 40px;
    width: 60px;
    padding: 10px;
  }

  .bold {
    font-weight: bold;
  }

  .stripe {
    background-color: #fafafa;
  }
}
</style>
