<template>
  <div class="attr-container">
    <p class="title">画布属性</p>
    <el-form style="padding: 20px">
      <el-form-item v-for="(value, key) in options" :key="key" :label="value">
        <el-color-picker
          v-if="isIncludesColor(key)"
          :model-value="(canvasStyleData as any)[key] as string"
          show-alpha
          @update:model-value="(v) => ((canvasStyleData as any)[key] = v || '')"
        />
        <el-input
          v-else
          v-model.number="canvasStyleData[key as keyof typeof canvasStyleData]"
          type="number"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()
const { canvasStyleData } = storeToRefs(editorStore)

const options = {
  color: '颜色',
  opacity: '不透明度',
  background: '背景色',
  fontSize: '字体大小',
}

function isIncludesColor(str: string): boolean {
  return str.toLowerCase().includes('color') || str === 'background'
}
</script>

<style lang="scss" scoped>
.attr-container {
  .title {
    text-align: center;
    margin-bottom: 10px;
    height: 40px;
    line-height: 40px;
    border-bottom: 2px solid #e4e7ed;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
  }
}
</style>
