import { onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useCopyStore } from '@/stores/copy'
import { useHistoryStore } from '@/stores/history'
import { eventBus } from '@/utils/eventBus'

const ctrlKey = 17
const commandKey = 91 // mac command
const vKey = 86 // 粘贴
const cKey = 67 // 复制
const xKey = 88 // 剪切
const yKey = 89 // 重做
const zKey = 90 // 撤销
const sKey = 83 // 保存
const pKey = 80 // 预览
const dKey = 68 // 删除
const deleteKey = 46 // 删除
const eKey = 69 // 清空画布

let isCtrlOrCommandDown = false

export function useKeyboard() {
  const editorStore = useEditorStore()
  const copyStore = useCopyStore()
  const historyStore = useHistoryStore()

  function copy() {
    copyStore.copy()
  }

  function paste() {
    const component = copyStore.createPastedComponent(false)
    if (!component) return
    historyStore.executeAdd(component, undefined, 'paste component')
    copyStore.afterPasteCommitted()
  }

  function cut() {
    const id = editorStore.curComponent?.id
    if (!id) return
    copyStore.cut()
    historyStore.executeDeleteById(id, 'cut component')
  }

  function redo() {
    historyStore.redo()
  }

  function undo() {
    historyStore.undo()
  }

  function save() {
    eventBus.emit('save')
  }

  function preview() {
    eventBus.emit('preview')
  }

  function deleteComponent() {
    const id = editorStore.curComponent?.id
    if (!id) return
    historyStore.executeDeleteById(id, 'delete component')
  }

  function clearCanvas() {
    eventBus.emit('clearCanvas')
  }

  const basemap: Record<number, () => void> = {
    [vKey]: paste,
    [yKey]: redo,
    [zKey]: undo,
    [sKey]: save,
    [pKey]: preview,
    [eKey]: clearCanvas,
  }

  const unlockMap: Record<number, () => void> = {
    ...basemap,
    [cKey]: copy,
    [xKey]: cut,
    [dKey]: deleteComponent,
    [deleteKey]: deleteComponent,
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!editorStore.isInEditor) return

    const { curComponent } = editorStore
    const { keyCode } = e

    if (keyCode === ctrlKey || keyCode === commandKey) {
      isCtrlOrCommandDown = true
    } else if (keyCode === deleteKey && curComponent) {
      historyStore.executeDeleteById(curComponent.id, 'delete component by delete key')
    } else if (isCtrlOrCommandDown && unlockMap[keyCode]) {
      e.preventDefault()
      unlockMap[keyCode]()
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.keyCode === ctrlKey || e.keyCode === commandKey) {
      isCtrlOrCommandDown = false
    }
  }

  function handleMouseDown() {
    editorStore.setInEditorStatus(false)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('mousedown', handleMouseDown)
  })

  return {
    copy,
    paste,
    cut,
    redo,
    undo,
    save,
    preview,
    deleteComponent,
    clearCanvas,
  }
}
