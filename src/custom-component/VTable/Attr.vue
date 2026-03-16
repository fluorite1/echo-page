<template>
  <div class="attr-list v-table-attr">
    <CommonAttr />
    <EditTable />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="斑马纹">
        <el-switch v-model="curComponent!.propValue.stripe" @change="record('table stripe')" />
      </el-form-item>
      <el-form-item label="表头加粗">
        <el-switch v-model="curComponent!.propValue.thBold" @change="record('table thBold')" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import EditTable from './EditTable.vue'
import { deepCopy } from '@/utils/common'
import type { Component } from '@/types'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { curComponent } = storeToRefs(editorStore)

const lastSnapshot = ref<Component | null>(null)
watch(
  curComponent,
  () => {
    lastSnapshot.value = curComponent.value ? deepCopy(curComponent.value) : null
  },
  { immediate: true }
)

function record(label: string) {
  const c = curComponent.value
  if (!c) return
  const before = lastSnapshot.value ?? deepCopy(c)
  const after = deepCopy(c)
  historyStore.executeUpdate(c.id, before, after, label)
  lastSnapshot.value = after
}
</script>
