<template>
  <div class="attr-list">
    <CommonAttr />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="按钮文字">
        <el-input v-model="curComponent!.propValue" @change="record" />
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

function record() {
  const c = curComponent.value
  if (!c) return
  const before = lastSnapshot.value ?? deepCopy(c)
  const after = deepCopy(c)
  historyStore.executeUpdate(c.id, before, after, 'update button text')
  lastSnapshot.value = after
}
</script>
