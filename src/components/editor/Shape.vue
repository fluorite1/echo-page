<template>
  <div class="shape" :class="{ active }" @click="selectCurComponent" @mousedown="handleMouseDownOnShape">
    <div
      v-for="item in isActive() ? getPointList() : []"
      :key="item"
      class="shape-point"
      :style="getPointStyle(item)"
      @mousedown="handleMouseDownOnPoint(item, $event)"
    ></div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { useContextMenuStore } from '@/stores/contextmenu'
import { eventBus } from '@/utils/eventBus'
import calculateComponentPositionAndSize from '@/utils/calculatePosition'
import { isPreventDrop } from '@/utils/common'
import type { Component, ComponentStyle } from '@/types'

interface Props {
  active: boolean
  element: Component
  defaultStyle: ComponentStyle
  index: number
}

const props = defineProps<Props>()

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const contextMenuStore = useContextMenuStore()
const { curComponent, editor } = storeToRefs(editorStore)

const pointList = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l']
const pointList2 = ['r', 'l']

const shapeRef = ref<HTMLElement>()

function getPointList(): string[] {
  return props.element.component === 'LineShape' ? pointList2 : pointList
}

function isActive(): boolean {
  return props.active
}

function getPointStyle(point: string): Record<string, string> {
  const { width, height } = props.defaultStyle
  const hasT = /t/.test(point)
  const hasB = /b/.test(point)
  const hasL = /l/.test(point)
  const hasR = /r/.test(point)
  let newLeft = 0
  let newTop = 0

  if (point.length === 2) {
    newLeft = hasL ? 0 : width
    newTop = hasT ? 0 : height
  } else {
    if (hasT || hasB) {
      newLeft = width / 2
      newTop = hasT ? 0 : height
    }

    if (hasL || hasR) {
      newLeft = hasL ? 0 : width
      newTop = Math.floor(height / 2)
    }
  }

  const style = {
    marginLeft: '-4px',
    marginTop: '-4px',
    left: `${newLeft}px`,
    top: `${newTop}px`,
    cursor: getCursor(point),
  }

  return style
}

function getCursor(point: string): string {
  const cursorMap: Record<string, string> = {
    lt: 'nw-resize',
    t: 'n-resize',
    rt: 'ne-resize',
    r: 'e-resize',
    rb: 'se-resize',
    b: 's-resize',
    lb: 'sw-resize',
    l: 'w-resize',
  }

  return cursorMap[point] || 'default'
}

function handleMouseDownOnShape(e: MouseEvent) {
  nextTick(() => eventBus.emit('componentClick'))

  editorStore.setInEditorStatus(true)
  editorStore.setClickComponentStatus(true)

  if (isPreventDrop(props.element.component)) {
    e.preventDefault()
  }

  e.stopPropagation()
  editorStore.setCurComponent(props.element, props.index)

  // 高频交互：移动只在 mouseup 时记录一次 update 命令
  historyStore.beginUpdate(props.element.id, { style: historyStore.snapshotStyle(props.defaultStyle) }, 'move component')

  const pos = { ...props.defaultStyle }
  const startY = e.clientY
  const startX = e.clientX
  const startTop = Number(pos.top)
  const startLeft = Number(pos.left)

  let hasMove = false

  const move = (moveEvent: MouseEvent) => {
    hasMove = true
    const curX = moveEvent.clientX
    const curY = moveEvent.clientY
    pos.top = curY - startY + startTop
    pos.left = curX - startX + startLeft

    editorStore.setShapeStyle(pos)

    nextTick(() => {
      eventBus.emit('move', [curY - startY > 0, curX - startX > 0])
    })
  }

  const up = () => {
    if (hasMove) {
      historyStore.commitUpdate({ style: historyStore.snapshotStyle(props.element.style) })
    } else {
      historyStore.cancelPendingUpdate()
    }
    eventBus.emit('unmove')
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }

  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

function selectCurComponent(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  contextMenuStore.hideContextMenu()

  if (!editorStore.rightList) {
    editorStore.toggleRightList()
  }
}

function handleMouseDownOnPoint(point: string, e: MouseEvent) {
  editorStore.setInEditorStatus(true)
  editorStore.setClickComponentStatus(true)
  e.stopPropagation()
  e.preventDefault()

  const style = { ...props.defaultStyle }
  const proportion = style.width / style.height

  const center = {
    x: style.left + style.width / 2,
    y: style.top + style.height / 2,
  }

  if (!editor.value) return
  const editorRectInfo = editor.value.getBoundingClientRect()

  const pointRect = (e.target as HTMLElement).getBoundingClientRect()
  const curPoint = {
    x: Math.round(pointRect.left - editorRectInfo.left + (e.target as HTMLElement).offsetWidth / 2),
    y: Math.round(pointRect.top - editorRectInfo.top + (e.target as HTMLElement).offsetHeight / 2),
  }

  const symmetricPoint = {
    x: center.x - (curPoint.x - center.x),
    y: center.y - (curPoint.y - center.y),
  }

  let needSave = false
  let isFirst = true
  const needLockProportion = false

  // 高频交互：缩放只在 mouseup 时记录一次 update 命令
  historyStore.beginUpdate(props.element.id, { style: historyStore.snapshotStyle(props.defaultStyle) }, 'resize component')

  const move = (moveEvent: MouseEvent) => {
    if (isFirst) {
      isFirst = false
      return
    }

    needSave = true
    const curPosition = {
      x: moveEvent.clientX - Math.round(editorRectInfo.left),
      y: moveEvent.clientY - Math.round(editorRectInfo.top),
    }

    calculateComponentPositionAndSize(point, style, curPosition, proportion, needLockProportion, {
      center,
      curPoint,
      symmetricPoint,
    })

    editorStore.setShapeStyle(style)
  }

  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
    if (needSave) {
      historyStore.commitUpdate({ style: historyStore.snapshotStyle(props.element.style) })
    } else {
      historyStore.cancelPendingUpdate()
    }
  }

  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

onMounted(() => {
  eventBus.on('runAnimation', () => {
    if (props.element === curComponent.value && shapeRef.value) {
      // runAnimation(shapeRef.value, curComponent.value.animations)
    }
  })

  eventBus.on('stopAnimation', () => {
    if (shapeRef.value) {
      shapeRef.value.classList.remove('animated', 'infinite')
    }
  })
})

onBeforeUnmount(() => {
  eventBus.off('runAnimation')
  eventBus.off('stopAnimation')
})
</script>

<style lang="scss" scoped>
.shape {
  position: absolute;

  &:hover {
    cursor: move;
  }
}

.active {
  outline: 1px solid #70c0ff;
  user-select: none;
}

.shape-point {
  position: absolute;
  background: #fff;
  border: 1px solid #59c7f9;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 1;
}
</style>
