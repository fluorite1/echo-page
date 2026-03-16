import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useEditorStore } from './editor'
import { useContextMenuStore } from './contextmenu'
import { deepCopy } from '@/utils/common'
import generateID from '@/utils/generateID'
import type { Component } from '@/types'

/** 键盘粘贴时的位置偏移（px），避免与原件完全重叠 */
const PASTE_OFFSET_PX = 10

export const useCopyStore = defineStore('copy', () => {
  /** 剪贴板中的组件（复制/剪切的内容），null 表示无内容 */
  const clipboardComponent = ref<Component | null>(null)
  const isCut = ref(false)

  function copy() {
    const editorStore = useEditorStore()
    if (!editorStore.curComponent) return

    clipboardComponent.value = deepCopy(editorStore.curComponent)
    isCut.value = false
  }

  /** 标记“剪切”模式（复制到剪贴板，但由调用方决定何时删除原件并写入历史） */
  function cut() {
    copy()
    if (!clipboardComponent.value) return
    isCut.value = true
  }

  /** 生成一个可粘贴的新组件（不直接写入画布），由调用方执行 add 命令入栈 */
  function createPastedComponent(isMouse = false): Component | null {
    const contextMenuStore = useContextMenuStore()

    if (!clipboardComponent.value) return null

    const data = deepCopy(clipboardComponent.value)
    data.id = generateID()

    if (isMouse) {
      data.style.top = contextMenuStore.menuTop
      data.style.left = contextMenuStore.menuLeft
    } else {
      data.style.top += PASTE_OFFSET_PX
      data.style.left += PASTE_OFFSET_PX
    }

    data.propValue = recursiveCopy(data.propValue)
    return data
  }

  /** 在 paste 成功写入画布后调用：剪切粘贴会清空剪贴板 */
  function afterPasteCommitted() {
    if (isCut.value) {
      clipboardComponent.value = null
      isCut.value = false
    }
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
    isCut,
    copy,
    cut,
    createPastedComponent,
    afterPasteCommitted,
  }
})
