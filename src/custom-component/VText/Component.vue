<template>
  <div class="v-text" :class="{ preview: editMode !== 'edit' }">
    <div
      :style="{ verticalAlign: element.style.verticalAlign, padding: element.style.padding + 'px' }"
      v-html="element.propValue"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import type { Component } from '@/types'

interface Props {
  propValue: string
  element: Component
}

defineProps<Props>()

const editorStore = useEditorStore()
const { editMode } = storeToRefs(editorStore)
</script>

<style lang="scss" scoped>
.v-text {
  width: 100%;
  height: 100%;
  display: table;

  div {
    display: table-cell;
    width: 100%;
    height: 100%;
    outline: none;
    word-break: break-all;
    padding: 4px;
  }
}

.preview {
  user-select: none;
}
</style>
