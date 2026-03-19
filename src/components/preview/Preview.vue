<template>
  <div class="preview-bg">
    <el-button class="close" @click="emit('close')">关闭</el-button>

    <div class="canvas-container">
      <div class="canvas" :style="canvasStyle">
        <PreviewNode
          v-for="item in previewSnapshot"
          :key="item.id"
          :item="item"
          :runtime="runtime"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { deepCopy } from '@/utils/common'
import { getCanvasStyle } from '@/utils/style'
import { createPreviewRuntime } from '@/custom-component/previewRuntime'
import type { Component } from '@/types'
import PreviewNode from './PreviewNode.vue'

defineOptions({
  name: 'EditorPreview',
})

const emit = defineEmits<{
  close: []
}>()

const editorStore = useEditorStore()
const { componentData, canvasStyleData } = storeToRefs(editorStore)

/** 预览用组件快照，不直接改 store，便于预览期独立运行动画等 */
const previewSnapshot = ref<Component[]>(deepCopy(componentData.value))
const runtime = createPreviewRuntime()

const canvasStyle = computed(() => {
  return {
    ...getCanvasStyle(canvasStyleData.value),
    width: `${canvasStyleData.value.width}px`,
    height: `${canvasStyleData.value.height}px`,
  }
})

onBeforeUnmount(() => {
  runtime.dispose()
})
</script>

<style lang="scss" scoped>
.preview-bg {
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  position: fixed;
  background: #fff;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;

  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: auto;

    .canvas {
      position: relative;
      margin: auto;
      background: #fff;
    }
  }

  .close {
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 1;
  }
}
</style>
