import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useEditorStore } from './editor'
import { deepCopy } from '@/utils/common'
import { changeComponentsSizeWithScale } from '@/utils/changeComponentsSize'
import type { Component } from '@/types'

/** 撤销到“最初”时的画布数据（空或导入的初始态），用于 undo 越过首帧 */
let defaultComponentData: Component[] = []

export function setDefaultComponentData(data: Component[] = []) {
  defaultComponentData = data
}

function getDefaultComponentData(): Component[] {
  return JSON.parse(JSON.stringify(defaultComponentData))
}

export const useSnapshotStore = defineStore('snapshot', () => {
  const snapshotData = ref<Component[][]>([])
  const snapshotIndex = ref(-1)
  const lastScale = ref(100)

  function recordSnapshot() {
    const editorStore = useEditorStore()
    const snapshotCopy = deepCopy(editorStore.componentData)

    snapshotData.value[++snapshotIndex.value] = snapshotCopy

    if (snapshotIndex.value < snapshotData.value.length - 1) {
      snapshotData.value = snapshotData.value.slice(0, snapshotIndex.value + 1)
    }
  }

  function undo() {
    if (snapshotIndex.value < 0) return

    const editorStore = useEditorStore()
    snapshotIndex.value--
    // 若已撤销到首帧之前，用“默认数据”（空或初始导入）恢复
    const componentData = deepCopy(snapshotData.value[snapshotIndex.value]) || getDefaultComponentData()
    if (componentData) {
      changeComponentsSizeWithScale(componentData, lastScale.value)

      editorStore.setComponentData(componentData)

      const curComponent = componentData.find((c) => c.id === editorStore.curComponent?.id)
      const index = curComponent ? componentData.indexOf(curComponent) : null
      editorStore.setCurComponent(curComponent || null, index)
    }
  }

  function redo() {
    if (snapshotIndex.value >= snapshotData.value.length - 1) return

    const editorStore = useEditorStore()
    snapshotIndex.value++

    const componentData = deepCopy(snapshotData.value[snapshotIndex.value])
    if (componentData) {
      changeComponentsSizeWithScale(componentData, lastScale.value)
      editorStore.setComponentData(componentData)
    }
  }

  function setLastScale(scale: number) {
    lastScale.value = scale
  }

  return {
    snapshotData,
    snapshotIndex,
    lastScale,
    recordSnapshot,
    undo,
    redo,
    setLastScale,
  }
})
