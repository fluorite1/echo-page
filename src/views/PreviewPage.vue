<template>
  <Preview @close="handleClose" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import Preview from '@/components/editor/Preview.vue'

const router = useRouter()
const editorStore = useEditorStore()

onMounted(() => {
  editorStore.setEditMode('preview')
  editorStore.setCurComponent(null, null)
})

onBeforeUnmount(() => {
  editorStore.setEditMode('edit')
})

function handleClose() {
  editorStore.setEditMode('edit')
  router.push({ name: 'Home' })
}
</script>
