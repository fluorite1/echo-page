<template>
  <div class="v-common-attr">
    <el-collapse v-model="activeName" accordion>
      <el-collapse-item title="通用样式" name="style">
        <el-form label-width="80px" size="small">
          <el-form-item v-for="({ key, label }, index) in styleKeys" :key="index" :label="label">
            <el-color-picker
              v-if="isIncludesColor(key)"
              :model-value="String(props.component.style[key as keyof ComponentStyle] ?? '')"
              show-alpha
              @change="(v) => handleStyleChange(key as keyof ComponentStyle, (v || '') as ComponentStyle[keyof ComponentStyle])"
            />
            <el-select
              v-else-if="selectKey.includes(key)"
              :model-value="props.component.style[key as keyof ComponentStyle]"
              @change="(v) => handleStyleChange(key as keyof ComponentStyle, v as ComponentStyle[keyof ComponentStyle])"
            >
              <el-option
                v-for="item in optionMap[key]"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-input
              v-else
              :model-value="styleDraft[key]"
              type="number"
              @update:model-value="(v) => updateStyleDraft(key, v)"
              @change="(v) => handleStyleChange(key as keyof ComponentStyle, normalizeNumberInput(v) as ComponentStyle[keyof ComponentStyle])"
            />
          </el-form-item>
        </el-form>
      </el-collapse-item>

      <InteractionAttr :component="props.component" @change="emit('change', $event)" />
      <SubscriptionsAttr
        :component="props.component"
        :component-data="props.componentData"
        @change="emit('change', $event)"
      />
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { deepCopy, isJSONEqual } from '@/utils/common'
import { styleData, selectKey, optionMap } from '@/utils/attr'
import type { Component, ComponentAttrChange, ComponentStyle } from '@/types'
import InteractionAttr from '@/custom-component/common/InteractionAttr.vue'
import SubscriptionsAttr from '@/custom-component/common/SubscriptionsAttr.vue'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const activeName = ref('')
const styleDraft = ref<Record<string, string | number | undefined>>({})

const styleKeys = computed(() => {
  const currentStyleKeys = Object.keys(props.component.style)
  return styleData.filter((item) => currentStyleKeys.includes(item.key))
})

watch(
  () => props.component,
  () => {
    activeName.value = 'style'
    styleDraft.value = deepCopy(props.component.style) as unknown as Record<
      string,
      string | number | undefined
    >
  },
  { immediate: true, deep: true }
)

function handleStyleChange<K extends keyof ComponentStyle>(key: K, value: ComponentStyle[K]) {
  const nextStyle = {
    ...props.component.style,
    ...styleDraft.value,
    [key]: value,
  } as ComponentStyle

  if (isJSONEqual(nextStyle, props.component.style)) return

  styleDraft.value = deepCopy(nextStyle) as unknown as Record<string, string | number | undefined>

  emit('change', {
    patch: {
      style: nextStyle,
    },
    label: 'update common style',
  })
}

function isIncludesColor(str: string): boolean {
  return str.toLowerCase().includes('color') || str === 'backgroundColor'
}

function updateStyleDraft(key: string, value: string | number) {
  styleDraft.value[key] = normalizeNumberInput(value)
}

function normalizeNumberInput(value: string | number): string | number {
  if (value === '') return ''
  const next = Number(value)
  return Number.isNaN(next) ? value : next
}
</script>

<style lang="scss" scoped>
.v-common-attr {
  padding: 10px;
}
</style>
