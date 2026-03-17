import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useEditorStore } from './editor'
import { useHistoryStore } from './history'
import { deepCopy } from '@/utils/common'
import generateID from '@/utils/generateID'
import type { Component } from '@/types'

export const useCopyStore = defineStore('copy', () => {
  /** 剪贴板中的组件（复制/剪切的内容），null 表示无内容 */
  const clipboardComponent = ref<Component | null>(null)
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()

  function copy() {
    if (!editorStore.curComponent) return
    clipboardComponent.value = deepCopy(editorStore.curComponent)
  }

  /** 标记“剪切”模式（复制到剪贴板，并删除原组件） */
  function cut() {
    copy()
    if (clipboardComponent.value) {
      historyStore.executeDeleteById(clipboardComponent.value.id)
    }
  }

  /** 生成一个可粘贴的新组件（不直接写入画布），由调用方执行 add 命令入栈 */
  function createPastedComponent(top: number, left: number): Component | null {
    if (!clipboardComponent.value) return null

    const data = deepCopy(clipboardComponent.value)
    data.id = generateID()

    data.style.top = top
    data.style.left = left

    data.propValue = recursiveCopy(data.propValue)
    return data
  }

  /** 递归克隆 propValue：若为组件数组（如表格单元格），为每项生成新 id 并继续递归 */
  function recursiveCopy(propValue: any): any {
    if (propValue && Array.isArray(propValue)) {
      return propValue.map((item: Component) => {
        const newItem = deepCopy(item)
        newItem.id = generateID()
        if (newItem.propValue) {
          newItem.propValue = recursiveCopy(newItem.propValue)
        }
        return newItem
      })
    }
    return propValue
  }

  return {
    clipboardComponent,
    copy,
    cut,
    createPastedComponent,
  }
})
