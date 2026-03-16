<template>
  <div class="circle-shape">
    <VText :prop-value="element.propValue" :element="element" />
  </div>
</template>

<script setup lang="ts">
import VText from '@/custom-component/VText/Component.vue'
import type { Component } from '@/types'

interface Props {
  propValue: string
  element: Component
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
.circle-shape {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: auto;
}
</style>
