<template>
  <div
    v-show="menuShow"
    class="contextmenu"
    :style="{ top: menuTop + 'px', left: menuLeft + 'px' }"
  >
    <ul @mouseup="handleMouseUp">
      <template v-if="curComponent">
        <li @click="copy">复制</li>
        <li @click="paste">粘贴</li>
        <li @click="cut">剪切</li>
        <li @click="deleteComponent">删除</li>
        <li @click="topComponent">置顶</li>
        <li @click="bottomComponent">置底</li>
        <li @click="upComponent">上移</li>
        <li @click="downComponent">下移</li>
      </template>
      <li v-else @click="paste">粘贴</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useContextMenuStore } from '@/stores/contextmenu'
import { useCopyStore } from '@/stores/copy'
import { useHistoryStore } from '@/stores/history'

const editorStore = useEditorStore()
const contextMenuStore = useContextMenuStore()
const copyStore = useCopyStore()
const historyStore = useHistoryStore()

const { menuTop, menuLeft, menuShow } = storeToRefs(contextMenuStore)
const { curComponent } = storeToRefs(editorStore)

function handleMouseUp() {
  editorStore.setClickComponentStatus(true)
}

function cut() {
  const id = editorStore.curComponent?.id
  if (!id) return
  copyStore.cut()
  historyStore.executeDeleteById(id, 'cut from context menu')
}

function copy() {
  copyStore.copy()
}

function paste() {
  const component = copyStore.createPastedComponent(
    contextMenuStore.menuTop,
    contextMenuStore.menuLeft,
  )
  if (!component) return
  historyStore.executeAdd(component, undefined, 'paste from context menu')
}

function deleteComponent() {
  if (editorStore.curComponent?.id) {
    historyStore.executeDeleteById(editorStore.curComponent.id, 'delete from context menu')
  }
}

function upComponent() {
  if (editorStore.curComponent?.id && editorStore.curComponentIndex !== null) {
    const from = editorStore.curComponentIndex
    const to = Math.min(editorStore.componentData.length - 1, from + 1)
    historyStore.executeReorder(from, to, 'layer up from context menu')
  }
}

function downComponent() {
  if (editorStore.curComponent?.id && editorStore.curComponentIndex !== null) {
    const from = editorStore.curComponentIndex
    const to = Math.max(0, from - 1)
    historyStore.executeReorder(from, to, 'layer down from context menu')
  }
}

function topComponent() {
  if (editorStore.curComponent?.id && editorStore.curComponentIndex !== null) {
    const from = editorStore.curComponentIndex
    const to = editorStore.componentData.length - 1
    historyStore.executeReorder(from, to, 'layer to top from context menu')
  }
}

function bottomComponent() {
  if (editorStore.curComponent?.id && editorStore.curComponentIndex !== null) {
    const from = editorStore.curComponentIndex
    const to = 0
    historyStore.executeReorder(from, to, 'layer to bottom from context menu')
  }
}
</script>

<style lang="scss" scoped>
.contextmenu {
  position: absolute;
  z-index: 1000;

  ul {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    margin: 5px 0;
    padding: 6px 0;

    li {
      font-size: 14px;
      padding: 0 20px;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #606266;
      height: 34px;
      line-height: 34px;
      box-sizing: border-box;
      cursor: pointer;

      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}
</style>
