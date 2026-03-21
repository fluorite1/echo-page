<template>
  <component
    :is="component.component + 'Attr'"
    :component="component"
    :component-data="componentData"
    @change="handleAttrChange"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import type { Component, ComponentAttrChange } from '@/types'

defineOptions({
  name: 'ComponentAttrPanel',
})

const props = defineProps<{
  component: Component
}>()

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { componentData } = storeToRefs(editorStore)

function handleAttrChange(change: ComponentAttrChange) {
  historyStore.executePatchUpdate(
    props.component.id,
    change.patch,
    change.label ?? 'update component attr',
  )
}
</script>
