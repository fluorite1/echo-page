<template>
  <div class="home">
    <Toolbar />
    <main>
      <!-- 左侧组件列表 -->
      <section class="left">
        <ComponentList />
        <RealTimeComponentList />
      </section>

      <!-- 中间画布 -->
      <section class="center">
        <div class="content" @drop="handleDrop" @dragover="handleDragOver">
          <Editor />
        </div>
      </section>

      <!-- 右侧属性面板 -->
      <section class="right">
        <CanvasAttr v-if="!curComponent" />
        <!-- 约定：组件名 + 'Attr' 为对应属性面板，如 VText -> VTextAttr -->
        <component v-else :is="curComponent.component + 'Attr'" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { deepCopy } from '@/utils/common'
import generateID from '@/utils/generateID'
import { LOCAL_STORAGE_KEYS } from '@/constants/storage'
import componentList from '@/custom-component/component-list'
import Editor from '@/components/editor/Editor.vue'
import Toolbar from '@/components/Toolbar.vue'
import ComponentList from '@/components/ComponentList.vue'
import RealTimeComponentList from '@/components/RealTimeComponentList.vue'
import CanvasAttr from '@/components/CanvasAttr.vue'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { editor, curComponent } = storeToRefs(editorStore)

onMounted(() => {
  restore()
})

/** 仅首次进入页面（画布为空）时从 localStorage 恢复，避免从预览返回时用旧缓存覆盖当前数据 */
function restore() {
  if (editorStore.componentData.length > 0) return

  const canvasData = localStorage.getItem(LOCAL_STORAGE_KEYS.CANVAS_DATA)
  const canvasStyle = localStorage.getItem(LOCAL_STORAGE_KEYS.CANVAS_STYLE)

  if (canvasData) {
    const data = JSON.parse(canvasData)
    editorStore.setComponentData(data)
  }

  if (canvasStyle) {
    editorStore.setCanvasStyle(JSON.parse(canvasStyle))
  }
  // 进入编辑页：清空历史，以当前画布为基线（教学项目：不跨页面保留历史）
  historyStore.clear()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  const index = e.dataTransfer?.getData('text/plain')
  if (!index) return

  if (!editor.value) {
    editorStore.getEditor()
    if (!editor.value) return
  }

  const rectInfo = editor.value.getBoundingClientRect()
  const component = deepCopy(componentList[parseInt(index)])
  if (!component) return

  component.style.top = e.clientY - rectInfo.y
  component.style.left = e.clientX - rectInfo.x
  component.id = generateID()

  historyStore.executeAdd(component, undefined, 'drop component from palette')
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}
</script>

<style lang="scss" scoped>
.home {
  height: 100vh;
  background: var(--main-bg-color);

  main {
    height: calc(100% - 64px);
    position: relative;
    background: var(--secondary-bg-color);
    display: flex;

    .left {
      width: 200px;
      height: 100%;
      background: var(--main-bg-color);
      border-right: 1px solid var(--border-color);
    }

    .center {
      flex: 1;
      height: 100%;
      overflow: auto;
      padding: 20px;
      margin-right: 288px;

      .content {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
    }

    .right {
      width: 288px;
      height: 100%;
      background: var(--main-bg-color);
      border-left: 1px solid var(--border-color);
      overflow-y: auto;
      position: absolute;
      right: 0;
      top: 0;

      .component-attr {
        .title {
          text-align: center;
          margin-bottom: 10px;
          height: 40px;
          line-height: 40px;
          border-bottom: 2px solid #e4e7ed;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color);
        }

        .attr-content {
          padding: 10px;
        }
      }
    }
  }
}
</style>
