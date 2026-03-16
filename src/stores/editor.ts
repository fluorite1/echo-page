import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Component, CanvasStyle, Animation } from '@/types'

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const componentData = ref<Component[]>([])
  const curComponent = ref<Component | null>(null)
  const curComponentIndex = ref<number | null>(null)
  const canvasStyleData = ref<CanvasStyle>({
    width: 1200,
    height: 740,
    scale: 100,
    color: '#000',
    opacity: 1,
    background: '#fff',
    fontSize: 14,
  })
  const editMode = ref<'edit' | 'preview'>('edit')
  const isClickComponent = ref(false)
  const isInEditor = ref(false)
  const rightList = ref(true)
  const editor = ref<HTMLElement | null>(null)

  // Getters
  const hasComponent = computed(() => componentData.value.length > 0)

  // Actions
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

  function setShapeStyle(style: Partial<Component['style']>) {
    if (!curComponent.value) return
    Object.assign(curComponent.value.style, style)
  }

  function setShapeSingleStyle<K extends keyof Component['style']>(key: K, value: Component['style'][K]) {
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

  function toggleRightList() {
    rightList.value = !rightList.value
  }

  function getEditor() {
    editor.value = document.querySelector('#editor')
  }

  // 动画相关
  function addAnimation(animation: Component['animations'][0]) {
    if (!curComponent.value) return
    curComponent.value.animations.push(animation)
  }

  function removeAnimation(index: number) {
    if (!curComponent.value) return
    curComponent.value.animations.splice(index, 1)
  }

  function alterAnimation(index: number, data: Partial<Animation>) {
    if (!curComponent.value || typeof index !== 'number') return
    const original = curComponent.value.animations[index]
    if (!original) return
    curComponent.value.animations[index] = { ...original, ...data }
  }

  // 事件相关
  function addEvent(event: string, param: string) {
    if (!curComponent.value) return
    curComponent.value.events[event] = param
  }

  function removeEvent(event: string) {
    if (!curComponent.value) return
    delete curComponent.value.events[event]
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
    rightList,
    editor,
    // Getters
    hasComponent,
    // Actions
    setCurComponent,
    addComponent,
    deleteComponent,
    setComponentData,
    setShapeStyle,
    setShapeSingleStyle,
    setCanvasStyle,
    setEditMode,
    setClickComponentStatus,
    setInEditorStatus,
    toggleRightList,
    getEditor,
    // Animation
    addAnimation,
    removeAnimation,
    alterAnimation,
    // Event
    addEvent,
    removeEvent,
    // Layer
    upComponent,
    downComponent,
    topComponent,
    bottomComponent,
  }
})
