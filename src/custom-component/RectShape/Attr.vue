<template>
  <div class="attr-list">
    <CommonAttr :component="props.component" :component-data="props.componentData" @change="emit('change', $event)" />
  </div>
</template>

<script setup lang="ts">
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import type { Component, ComponentAttrChange } from '@/types'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()
</script>
