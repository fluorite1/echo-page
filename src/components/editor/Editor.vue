<template>
  <div
    id="editor"
    class="editor"
    :class="{ edit: isEdit }"
    :style="{
      ...getCanvasStyle(canvasStyleData),
      width: canvasStyleData.width + 'px',
      height: canvasStyleData.height + 'px',
    }"
    @mousedown.self="clearCurComponent"
    @contextmenu="handleContextMenu"
  >
    <Grid />

    <Shape
      v-for="(item, index) in componentData"
      :key="item.id"
      :default-style="item.style"
      :style="getShapeStyle(item.style)"
      :active="item.id === curComponent?.id"
      :element="item"
      :index="index"
    >
      <component
        :is="item.component"
        :id="COMPONENT_DOM_ID_PREFIX + item.id"
        class="component"
        :style="getComponentStyle(item.style)"
        :prop-value="item.propValue"
        :element="item"
      />
    </Shape>

    <ContextMenu />
    <MarkLine />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useContextMenuStore } from '@/stores/contextmenu'
import { getShapeStyle, getCanvasStyle, getComponentStyle } from '@/utils/style'
import { COMPONENT_DOM_ID_PREFIX } from '@/constants/dom'
import Shape from './Shape.vue'
import ContextMenu from './ContextMenu.vue'
import MarkLine from './MarkLine.vue'
import Grid from './Grid.vue'

interface Props {
  isEdit?: boolean
}

withDefaults(defineProps<Props>(), {
  isEdit: true,
})

const editorStore = useEditorStore()
const contextMenuStore = useContextMenuStore()

const { componentData, curComponent, canvasStyleData, editor } = storeToRefs(editorStore)

onMounted(() => {
  editorStore.getEditor()
})

function handleContextMenu(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()

  if (!editor.value) return
  const editorRect = editor.value.getBoundingClientRect()

  const left = e.clientX - editorRect.left
  const top = e.clientY - editorRect.top

  contextMenuStore.showContextMenu({ top, left })
}

function clearCurComponent() {
  editorStore.setCurComponent(null, null)
  contextMenuStore.hideContextMenu()
}
</script>

<style lang="scss" scoped>
.editor {
  position: relative;
  background: #fff;
  margin: auto;

  .lock {
    opacity: 0.5;

    &:hover {
      cursor: not-allowed;
    }
  }
}

.edit {
  .component {
    outline: none;
    width: 100%;
    height: 100%;
  }
}
</style>
