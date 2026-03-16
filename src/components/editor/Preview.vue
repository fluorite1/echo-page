<template>
  <div class="preview-bg">
    <el-button class="close" @click="emit('close')">关闭</el-button>

    <div class="canvas-container">
      <div class="canvas" :style="canvasStyle">
        <div
          v-for="item in previewSnapshot"
          :key="item.id"
          class="shape"
          :style="getShapeStyle(item.style)"
          @click="onTrigger('v-click', item.id)"
          @mouseenter="onTrigger('v-hover', item.id)"
        >
          <component
            :is="item.component"
            :id="COMPONENT_DOM_ID_PREFIX + item.id"
            class="component"
            :style="getComponentStyle(item.style)"
            :prop-value="item.propValue"
            :element="item"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { deepCopy } from '@/utils/common'
import { getCanvasStyle, getShapeStyle, getComponentStyle } from '@/utils/style'
import { createPreviewRuntime } from '@/custom-component/previewRuntime'
import { COMPONENT_DOM_ID_PREFIX } from '@/constants/dom'
import type { Component, PreviewEventType } from '@/types'

defineOptions({
  name: 'EditorPreview',
})

const emit = defineEmits<{
  close: []
}>()

const editorStore = useEditorStore()
const { componentData, canvasStyleData } = storeToRefs(editorStore)

/** 预览用组件快照，不直接改 store，便于预览期独立运行动画等 */
const previewSnapshot = ref<Component[]>([])

const runtime = ref<ReturnType<typeof createPreviewRuntime> | null>(null)

onMounted(() => {
  previewSnapshot.value = deepCopy(componentData.value)
  runtime.value = createPreviewRuntime(previewSnapshot.value)
})

onBeforeUnmount(() => {
  runtime.value?.dispose()
  runtime.value = null
})

const canvasStyle = computed(() => {
  return {
    ...getCanvasStyle(canvasStyleData.value),
    width: `${canvasStyleData.value.width}px`,
    height: `${canvasStyleData.value.height}px`,
  }
})

function onTrigger(eventType: PreviewEventType, sourceId: string) {
  runtime.value?.emit(eventType, sourceId)
}
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

  .shape {
    position: absolute;
  }

  .component {
    outline: none;
    width: 100%;
    height: 100%;
    user-select: none;
  }

  .close {
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 1;
  }
}
</style>

