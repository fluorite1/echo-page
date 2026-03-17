import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Component, CanvasStyle } from '@/types'

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const componentData = ref<Component[]>([])
  const curComponent = ref<Component | null>(null)
  const curComponentIndex = ref<number | null>(null)
  const canvasStyleData = ref<CanvasStyle>({
    width: 1200,
    height: 740,
    color: '#000',
    opacity: 1,
    background: '#fff',
    fontSize: 14,
  })
  const editMode = ref<'edit' | 'preview'>('edit')
  const isClickComponent = ref(false)
  const isInEditor = ref(false)
  const editor = ref<HTMLElement | null>(null)

  // Getters
  const hasComponent = computed(() => componentData.value.length > 0)

  // Actions
  function findIndexById(id: string): number {
    return componentData.value.findIndex((c) => c.id === id)
  }

  function getComponentByIndex(index: number): Component | undefined {
    return componentData.value[index]
  }

  function getComponentById(id: string): Component | undefined {
    const index = findIndexById(id)
    return getComponentByIndex(index)
  }

  function setCurComponent(component: Component | null, index: number | null) {
    curComponent.value = component
    curComponentIndex.value = index
  }

  function addComponent(component: Component, index?: number) {
    if (index !== undefined) {
      componentData.value.splice(index, 0, component)
    } else {
      componentData.value.push(component)
    }
  }

  function deleteComponent(index?: number) {
    const targetIndex = index ?? curComponentIndex.value
    if (targetIndex === null) return

    if (targetIndex === curComponentIndex.value) {
      curComponentIndex.value = null
      curComponent.value = null
    }
    componentData.value.splice(targetIndex, 1)
  }

  function setComponentData(data: Component[]) {
    componentData.value = data
  }

  /** 用完整快照替换某个组件（用于 update 命令 do/undo） */
  function replaceComponentById(id: string, next: Component): void {
    const index = findIndexById(id)
    if (index < 0) return
    componentData.value[index] = next
    if (curComponent.value?.id === id) {
      curComponent.value = next
      curComponentIndex.value = index
    }
  }

  /** 将组件从 from 移动到 to（图层排序的基础操作） */
  function moveComponent(from: number, to: number): void {
    if (from === to) return
    if (from < 0 || from >= componentData.value.length) return
    const clampedTo = Math.max(0, Math.min(componentData.value.length - 1, to))

    const [item] = componentData.value.splice(from, 1)
    if (!item) return
    componentData.value.splice(clampedTo, 0, item)

    // 同步选中索引（若有选中）
    if (curComponentIndex.value === null) return
    if (curComponentIndex.value === from) {
      curComponentIndex.value = clampedTo
      curComponent.value = item
      return
    }
    // 选中项在移动区间内，索引随之偏移
    if (
      from < clampedTo &&
      curComponentIndex.value > from &&
      curComponentIndex.value <= clampedTo
    ) {
      curComponentIndex.value--
    } else if (
      from > clampedTo &&
      curComponentIndex.value >= clampedTo &&
      curComponentIndex.value < from
    ) {
      curComponentIndex.value++
    }
  }

  function setShapeStyle(style: Partial<Component['style']>) {
    if (!curComponent.value) return
    Object.assign(curComponent.value.style, style)
  }

  function setShapeSingleStyle<K extends keyof Component['style']>(
    key: K,
    value: Component['style'][K],
  ) {
    if (!curComponent.value) return
    curComponent.value.style[key] = value
  }

  function setCanvasStyle(style: CanvasStyle) {
    canvasStyleData.value = style
  }

  function setEditMode(mode: 'edit' | 'preview') {
    editMode.value = mode
  }

  function setClickComponentStatus(status: boolean) {
    isClickComponent.value = status
  }

  function setInEditorStatus(status: boolean) {
    isInEditor.value = status
  }

  function getEditor() {
    editor.value = document.querySelector('#editor')
  }

  // 图层相关
  function upComponent() {
    if (curComponentIndex.value === null) return
    if (curComponentIndex.value < componentData.value.length - 1) {
      const temp = componentData.value[curComponentIndex.value]
      const next = componentData.value[curComponentIndex.value + 1]
      if (temp && next) {
        componentData.value[curComponentIndex.value] = next
        componentData.value[curComponentIndex.value + 1] = temp
        curComponentIndex.value++
      }
    }
  }

  function downComponent() {
    if (curComponentIndex.value === null) return
    if (curComponentIndex.value > 0) {
      const temp = componentData.value[curComponentIndex.value]
      const prev = componentData.value[curComponentIndex.value - 1]
      if (temp && prev) {
        componentData.value[curComponentIndex.value] = prev
        componentData.value[curComponentIndex.value - 1] = temp
        curComponentIndex.value--
      }
    }
  }

  function topComponent() {
    if (curComponentIndex.value === null || !curComponent.value) return
    componentData.value.splice(curComponentIndex.value, 1)
    componentData.value.push(curComponent.value)
    curComponentIndex.value = componentData.value.length - 1
  }

  function bottomComponent() {
    if (curComponentIndex.value === null || !curComponent.value) return
    componentData.value.splice(curComponentIndex.value, 1)
    componentData.value.unshift(curComponent.value)
    curComponentIndex.value = 0
  }

  return {
    // State
    componentData,
    curComponent,
    curComponentIndex,
    canvasStyleData,
    editMode,
    isClickComponent,
    isInEditor,
    editor,
    // Getters
    hasComponent,
    // Actions
    setCurComponent,
    addComponent,
    deleteComponent,
    setComponentData,
    findIndexById,
    getComponentByIndex,
    getComponentById,
    replaceComponentById,
    moveComponent,
    setShapeStyle,
    setShapeSingleStyle,
    setCanvasStyle,
    setEditMode,
    setClickComponentStatus,
    setInEditorStatus,
    getEditor,
    // Layer
    upComponent,
    downComponent,
    topComponent,
    bottomComponent,
  }
})
