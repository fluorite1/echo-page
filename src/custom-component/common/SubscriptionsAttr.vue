<template>
  <el-collapse-item title="事件订阅（预览生效）" name="subscriptions">
    <div class="subscriptions">
      <div v-for="(rule, idx) in subscriptions" :key="rule.id" class="rule">
        <div class="row">
          <el-select
            :model-value="rule.sourceId"
            placeholder="监听组件"
            @change="(value) => updateRule(rule.id, (target) => { target.sourceId = String(value ?? '') })"
          >
            <el-option
              v-for="c in sourceOptions"
              :key="c.id"
              :label="c.label || c.id"
              :value="c.id"
            />
          </el-select>

          <el-select
            :model-value="rule.eventType"
            placeholder="事件类型"
            style="width: 120px"
            @change="(value) => updateRule(rule.id, (target) => { target.eventType = value as any })"
          >
            <el-option label="点击" value="v-click" />
            <el-option label="悬浮" value="v-hover" />
          </el-select>

          <el-button type="danger" text @click="removeRule(idx)">删除</el-button>
        </div>

        <div class="row">
          <el-select
            :model-value="rule.actions[0].animation.value"
            placeholder="动画"
            @change="(value) => syncLabel(rule.id, String(value ?? ''))"
          >
            <el-option v-for="a in animationOptions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>

          <el-input-number
            :model-value="rule.actions[0].animation.duration"
            :min="0"
            :step="0.1"
            @change="(value) => updateRule(rule.id, (target) => { target.actions[0].animation.duration = value ?? 0 })"
          />
          <span class="unit">秒</span>

          <el-input-number
            :model-value="rule.actions[0].animation.delay"
            :min="0"
            :step="0.1"
            @change="(value) => updateRule(rule.id, (target) => { target.actions[0].animation.delay = value ?? 0 })"
          />
          <span class="unit">延迟</span>

          <el-input-number
            v-if="rule.actions[0].animation.iterationCount !== 'infinite'"
            :model-value="rule.actions[0].animation.iterationCount"
            :min="1"
            :step="1"
            @change="(value) => updateRule(rule.id, (target) => { target.actions[0].animation.iterationCount = value ?? 1 })"
          />
          <el-select
            v-else
            :model-value="rule.actions[0].animation.iterationCount"
            style="width: 100px"
            @change="(value) => updateRule(rule.id, (target) => { target.actions[0].animation.iterationCount = value as any })"
          >
            <el-option label="无限" value="infinite" />
          </el-select>

          <el-checkbox
            :model-value="infiniteFlags[rule.id]"
            @change="(value) => toggleInfinite(rule.id, Boolean(value))"
          >
            无限
          </el-checkbox>
        </div>
      </div>

      <el-button style="width: 100%" @click="addRule">添加订阅</el-button>
    </div>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import generateID from '@/utils/generateID'
import { ANIMATION_PRESETS } from '@/constants/animations'
import type { Animation, AnimationAction, Component, ComponentAttrChange, SubscriptionRule } from '@/types'
import { deepCopy, isJSONEqual } from '@/utils/common'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

type RuleVM = SubscriptionRule & { actions: [AnimationAction] }

function defaultAnimation(): Animation {
  return { label: '渐显', value: 'fadeIn', duration: 1, delay: 0, iterationCount: 1 }
}

const subscriptions = computed<RuleVM[]>(() => {
  return (props.component.subscriptions || []) as RuleVM[]
})

const sourceOptions = computed(() => {
  return props.componentData.filter((c) => c.id !== props.component.id)
})

const animationOptions = computed(() => {
  return ANIMATION_PRESETS
})

const infiniteFlags = reactive<Record<string, boolean>>({})

watch(
  subscriptions,
  (list) => {
    list.forEach((rule) => {
      infiniteFlags[rule.id] = rule.actions[0].animation.iterationCount === 'infinite'
    })
  },
  { immediate: true },
)

function addRule() {
  const rule: RuleVM = {
    id: generateID(),
    sourceId: sourceOptions.value[0]?.id || '',
    eventType: 'v-click',
    actions: [
      {
        type: 'animation',
        animation: defaultAnimation(),
      },
    ],
  }
  infiniteFlags[rule.id] = rule.actions[0].animation.iterationCount === 'infinite'
  emitSubscriptions([...subscriptions.value, rule], 'update subscriptions')
}

function removeRule(index: number) {
  const next = deepCopy(subscriptions.value)
  const rule = next[index]
  next.splice(index, 1)
  if (rule) delete infiniteFlags[rule.id]
  emitSubscriptions(next, 'update subscriptions')
}

function toggleInfinite(id: string, flag: boolean) {
  infiniteFlags[id] = flag
  updateRule(id, (target) => {
    target.actions[0].animation.iterationCount = flag ? 'infinite' : 1
  })
}

function syncLabel(id: string, value: string) {
  const option = animationOptions.value.find((o) => o.value === value)
  updateRule(id, (target) => {
    target.actions[0].animation.value = value
    target.actions[0].animation.label = option?.label || value
  })
}

function updateRule(id: string, updater: (rule: RuleVM) => void) {
  const next = deepCopy(subscriptions.value)
  const target = next.find((rule) => rule.id === id)
  if (!target) return
  updater(target)
  emitSubscriptions(next, 'update subscriptions')
}

function emitSubscriptions(list: RuleVM[], label: string) {
  if (isJSONEqual(list, props.component.subscriptions ?? [])) return

  emit('change', {
    patch: { subscriptions: list },
    label,
  })
}
</script>

<style scoped lang="scss">
.subscriptions {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left; // App.vue 默认 text-align: center，会影响右侧面板观感
}

.rule {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px;
  background: var(--main-bg-color);
  max-width: 100%;
  overflow-x: auto; // 避免控件过多时溢出视野
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap; // 小屏/右侧面板避免横向溢出
}

.row :deep(.el-select) {
  min-width: 140px;
  flex: 1 1 160px;
}

.row :deep(.el-input-number) {
  width: 120px;
}

.row :deep(.el-button) {
  flex: 0 0 auto;
}

.row :deep(.el-checkbox) {
  flex: 0 0 auto;
}

.unit {
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.8;
  white-space: nowrap;
}
</style>
