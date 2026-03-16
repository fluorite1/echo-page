<template>
  <div class="attr-list">
    <CommonAttr />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="图片URL">
        <el-input v-model="curComponent!.propValue.url" placeholder="请输入图片URL" @change="record('update picture url')" />
      </el-form-item>
      <el-form-item label="镜像翻转">
        <div>
          <el-checkbox v-model="curComponent!.propValue.flip.horizontal" @change="record('flip horizontal')">水平翻转</el-checkbox>
          <el-checkbox v-model="curComponent!.propValue.flip.vertical" @change="record('flip vertical')">垂直翻转</el-checkbox>
        </div>
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

function record(label: string) {
  const c = curComponent.value
  if (!c) return
  const before = lastSnapshot.value ?? deepCopy(c)
  const after = deepCopy(c)
  historyStore.executeUpdate(c.id, before, after, label)
  lastSnapshot.value = after
}
</script>
