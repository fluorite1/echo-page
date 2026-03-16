<template>
  <div v-if="editMode === 'edit'" class="v-text" @keydown="handleKeydown" @keyup="handleKeyup">
    <div
      ref="textRef"
      :contenteditable="canEdit"
      :class="{ 'can-edit': canEdit }"
      tabindex="0"
      :style="{ verticalAlign: element.style.verticalAlign, padding: element.style.padding + 'px' }"
      @dblclick="setEdit"
      @paste="clearStyle"
      @mousedown="handleMousedown"
      @blur="handleBlur"
      @input="handleInput"
      v-html="element.propValue"
    ></div>
  </div>
  <div v-else class="v-text preview">
    <div
      :style="{ verticalAlign: element.style.verticalAlign, padding: element.style.padding + 'px' }"
      v-html="element.propValue"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { eventBus } from '@/utils/eventBus'
import type { Component } from '@/types'
import { deepCopy } from '@/utils/common'

interface Props {
  propValue: string
  element: Component
}

const props = defineProps<Props>()
const emit = defineEmits<{
  input: [element: Component, value: string]
}>()

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { editMode, curComponent } = storeToRefs(editorStore)

const canEdit = ref(false)
const ctrlKey = 17
const isCtrlDown = ref(false)
const textRef = ref<HTMLElement>()

const keycodes = [66, 67, 68, 73, 83, 85, 88, 89, 90] // B C D I S U X Y Z

const editBefore = ref<Component | null>(null)

function onComponentClick() {
  if (curComponent.value?.id !== props.element.id) {
    canEdit.value = false
  }
}

function handleInput(e: Event) {
  const target = e.target as HTMLElement
  emit('input', props.element, target.innerHTML)
}

function handleKeydown(e: KeyboardEvent) {
  if (canEdit.value) e.stopPropagation()

  if (e.keyCode === ctrlKey) {
    isCtrlDown.value = true
  } else if (isCtrlDown.value && canEdit.value && keycodes.includes(e.keyCode)) {
    e.stopPropagation()
  } else if (e.keyCode === 46) {
    e.stopPropagation()
  }
}

function handleKeyup(e: KeyboardEvent) {
  if (canEdit.value) e.stopPropagation()

  if (e.keyCode === ctrlKey) {
    isCtrlDown.value = false
  }
}

function handleMousedown(e: MouseEvent) {
  if (canEdit.value) {
    e.stopPropagation()
  }
}

function clearStyle(e: ClipboardEvent) {
  e.preventDefault()
  const clp = e.clipboardData
  const text = clp?.getData('text/plain') || ''
  if (text !== '') {
    document.execCommand('insertText', false, text)
  }

  const target = e.target as HTMLElement
  emit('input', props.element, target.innerHTML)
}

function handleBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  const raw = target.innerHTML
  const nextHtml = raw !== '' ? raw : '&nbsp;'

  const before = editBefore.value

  props.element.propValue = nextHtml
  canEdit.value = false

  if (!before) return
  const after = deepCopy(props.element)
  // 仅在一次编辑会话结束时记录一次 update 命令
  if (JSON.stringify(before) === JSON.stringify(after)) return
  historyStore.executeUpdate(props.element.id, before, after, 'edit text')
  editBefore.value = null
}

function setEdit() {
  canEdit.value = true
  editBefore.value = deepCopy(props.element)
  if (textRef.value) {
    selectText(textRef.value)
  }
}

function selectText(element: HTMLElement) {
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(element)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

onMounted(() => {
  eventBus.on('componentClick', onComponentClick)
})

onBeforeUnmount(() => {
  eventBus.off('componentClick', onComponentClick)
})
</script>

<style lang="scss" scoped>
.v-text {
  width: 100%;
  height: 100%;
  display: table;

  div {
    display: table-cell;
    width: 100%;
    height: 100%;
    outline: none;
    word-break: break-all;
    padding: 4px;
  }

  .can-edit {
    cursor: text;
    height: 100%;
  }
}

.preview {
  user-select: none;
}
</style>
