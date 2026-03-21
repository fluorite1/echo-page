<template>
  <div class="attr-list">
    <CommonAttr :component="props.component" :component-data="props.componentData" @change="emit('change', $event)" />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="内容">
        <el-input
          v-model="textDraft"
          type="textarea"
          :rows="3"
          @change="onChangeText"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import type { Component, ComponentAttrChange } from '@/types'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const textDraft = ref('')

watch(
  () => props.component.propValue,
  (value) => {
    textDraft.value = String(value ?? '')
  },
  { immediate: true },
)

function onChangeText(value: string) {
  const nextValue = String(value ?? '')
  if (nextValue === String(props.component.propValue ?? '')) return

  emit('change', {
    patch: { propValue: nextValue },
    label: 'update text content',
  })
}
</script>
