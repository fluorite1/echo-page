<template>
  <div class="real-time-component-list">
    <div
      v-for="(item, index) in componentData"
      :key="item.id"
      class="list"
      :class="{ actived: transformIndex(index) === curComponentIndex }"
      @click="onClick(transformIndex(index))"
    >
      <span class="iconfont" :class="'icon-' + getComponent(index)?.icon"></span>
      <span>{{ getComponent(index)?.label }}</span>
      <div class="icon-container">
        <span class="iconfont icon-shangyi" @click.stop="upComponent(transformIndex(index))"></span>
        <span class="iconfont icon-xiayi" @click.stop="downComponent(transformIndex(index))"></span>
        <span
          class="iconfont icon-shanchu"
          @click.stop="deleteComponent(transformIndex(index))"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { componentData, curComponentIndex } = storeToRefs(editorStore)

function getComponent(index: number) {
  return componentData.value[componentData.value.length - 1 - index]
}

function transformIndex(index: number) {
  return componentData.value.length - 1 - index
}

function onClick(index: number) {
  setCurComponent(index)
}

function deleteComponent(index: number) {
  setTimeout(() => {
    const component = componentData.value[index]
    if (!component) return
    historyStore.executeDeleteById(component.id, 'delete from layer list')
  })
}

function upComponent(index: number) {
  setTimeout(() => {
    const component = componentData.value[index]
    if (component) {
      const from = index
      const to = Math.min(componentData.value.length - 1, from + 1)
      editorStore.setCurComponent(component, index)
      historyStore.executeReorder(component.id, from, to, 'layer move up from list')
    }
  })
}

function downComponent(index: number) {
  setTimeout(() => {
    const component = componentData.value[index]
    if (component) {
      const from = index
      const to = Math.max(0, from - 1)
      editorStore.setCurComponent(component, index)
      historyStore.executeReorder(component.id, from, to, 'layer move down from list')
    }
  })
}

function setCurComponent(index: number) {
  const component = componentData.value[index]
  if (component) {
    editorStore.setCurComponent(component, index)
  }
}
</script>

<style lang="scss" scoped>
.real-time-component-list {
  height: 35%;
  overflow-y: auto;

  .list {
    height: 30px;
    cursor: grab;
    text-align: center;
    color: var(--text-color);
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 0 10px;
    position: relative;
    user-select: none;
    opacity: 1;

    &:active {
      cursor: grabbing;
    }

    &:hover {
      background-color: rgba(200, 200, 200, 0.2);

      .icon-container {
        display: block;
      }
    }

    .iconfont {
      margin-right: 4px;
      font-size: 16px;
    }

    .icon-wenben,
    .icon-tupian {
      font-size: 14px;
    }

    .icon-container {
      position: absolute;
      right: 10px;
      display: none;

      .iconfont {
        cursor: pointer;
      }
    }
  }

  .actived {
    background: #ecf5ff;
    color: #409eff;
  }
}
</style>
