<template>
  <div class="attr-list">
    <CommonAttr :component="props.component" :component-data="props.componentData" @change="emit('change', $event)" />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="图片URL">
        <el-input
          v-model="urlDraft"
          placeholder="请输入图片URL"
          @change="(value) => updatePicture({ url: value }, 'update picture url')"
        />
      </el-form-item>
      <el-form-item label="镜像翻转">
        <div>
          <el-checkbox
            :model-value="pictureValue.flip.horizontal"
            @change="(value) => updatePicture({ flip: { ...pictureValue.flip, horizontal: Boolean(value) } }, 'flip horizontal')"
          >
            水平翻转
          </el-checkbox>
          <el-checkbox
            :model-value="pictureValue.flip.vertical"
            @change="(value) => updatePicture({ flip: { ...pictureValue.flip, vertical: Boolean(value) } }, 'flip vertical')"
          >
            垂直翻转
          </el-checkbox>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import { isJSONEqual } from '@/utils/common'
import type { Component, ComponentAttrChange } from '@/types'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const urlDraft = ref('')

const pictureValue = computed(() => {
  const value = props.component.propValue ?? {}
  return {
    url: value.url ?? '',
    flip: {
      horizontal: Boolean(value.flip?.horizontal),
      vertical: Boolean(value.flip?.vertical),
    },
  }
})

watch(
  pictureValue,
  (value) => {
    urlDraft.value = value.url
  },
  { immediate: true, deep: true },
)

function updatePicture(nextPartial: Record<string, unknown>, label: string) {
  const nextValue = {
    ...pictureValue.value,
    ...nextPartial,
  }

  if (isJSONEqual(nextValue, pictureValue.value)) return

  emit('change', {
    patch: {
      propValue: nextValue,
    },
    label,
  })
}
</script>
