<template>
  <div class="v-common-attr">
    <el-collapse v-model="activeName" accordion @change="onChange">
      <el-collapse-item title="通用样式" name="style">
        <el-form label-width="80px" size="small">
          <el-form-item v-for="({ key, label }, index) in styleKeys" :key="index" :label="label">
            <el-color-picker
              v-if="isIncludesColor(key)"
              v-model="curComponent!.style[key as keyof ComponentStyle]"
              show-alpha
              @change="handleStyleChange"
            />
            <el-select
              v-else-if="selectKey.includes(key)"
              v-model="curComponent!.style[key as keyof ComponentStyle]"
              @change="handleStyleChange"
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
              v-model.number="curComponent!.style[key as keyof ComponentStyle]"
              type="number"
              @change="handleStyleChange"
            />
          </el-form-item>
        </el-form>
      </el-collapse-item>

      <InteractionAttr />
      <SubscriptionsAttr />
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { styleData, selectKey, optionMap } from '@/utils/attr'
import type { ComponentStyle } from '@/types'
import { deepCopy } from '@/utils/common'
import InteractionAttr from '@/custom-component/common/InteractionAttr.vue'
import SubscriptionsAttr from '@/custom-component/common/SubscriptionsAttr.vue'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { curComponent } = storeToRefs(editorStore)

const activeName = ref('')
const lastStyleSnapshot = ref<ComponentStyle | null>(null)

const styleKeys = computed(() => {
  if (curComponent.value) {
    const curComponentStyleKeys = Object.keys(curComponent.value.style)
    return styleData.filter((item) => curComponentStyleKeys.includes(item.key))
  }
  return []
})

watch(
  curComponent,
  () => {
    if (curComponent.value) {
      activeName.value = curComponent.value.collapseName || 'style'
      lastStyleSnapshot.value = deepCopy(curComponent.value.style)
    }
  },
  { immediate: true }
)

function onChange() {
  if (curComponent.value) {
    curComponent.value.collapseName = activeName.value
  }
}

function handleStyleChange() {
  const c = curComponent.value
  if (!c) return
  const before = lastStyleSnapshot.value ? deepCopy(lastStyleSnapshot.value) : deepCopy(c.style)
  const after = deepCopy(c.style)
  historyStore.executeUpdate(c.id, { style: before }, { style: after }, 'update common style')
  lastStyleSnapshot.value = after
}

function isIncludesColor(str: string): boolean {
  return str.toLowerCase().includes('color') || str === 'backgroundColor'
}
</script>

<style lang="scss" scoped>
.v-common-attr {
  padding: 10px;
}
</style>
