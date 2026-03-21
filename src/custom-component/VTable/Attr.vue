<template>
  <div class="attr-list v-table-attr">
    <CommonAttr :component="props.component" :component-data="props.componentData" @change="emit('change', $event)" />
    <EditTable :component="props.component" @change="emit('change', $event)" />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="斑马纹">
        <el-switch :model-value="tableValue.stripe" @change="(value) => updateTable({ stripe: Boolean(value) }, 'table stripe')" />
      </el-form-item>
      <el-form-item label="表头加粗">
        <el-switch :model-value="tableValue.thBold" @change="(value) => updateTable({ thBold: Boolean(value) }, 'table thBold')" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import EditTable from './EditTable.vue'
import { isJSONEqual } from '@/utils/common'
import type { Component, ComponentAttrChange } from '@/types'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const tableValue = computed(() => {
  const value = props.component.propValue ?? {}
  return {
    data: Array.isArray(value.data) ? value.data : [],
    stripe: Boolean(value.stripe),
    thBold: Boolean(value.thBold),
  }
})

function updateTable(nextPartial: Record<string, unknown>, label: string) {
  const nextValue = {
    ...tableValue.value,
    ...nextPartial,
  }

  if (isJSONEqual(nextValue, tableValue.value)) return

  emit('change', {
    patch: {
      propValue: nextValue,
    },
    label,
  })
}
</script>
