<template>
  <el-collapse-item title="事件订阅（预览生效）" name="subscriptions">
    <div class="subscriptions">
      <div v-for="(rule, idx) in subscriptions" :key="rule.id" class="rule">
        <div class="row">
          <el-select v-model="rule.sourceId" placeholder="监听组件" @change="record">
            <el-option
              v-for="c in sourceOptions"
              :key="c.id"
              :label="c.label || c.id"
              :value="c.id"
            />
          </el-select>

          <el-select v-model="rule.eventType" placeholder="事件类型" style="width: 120px" @change="record">
            <el-option label="点击" value="v-click" />
            <el-option label="悬浮" value="v-hover" />
          </el-select>

          <el-button type="danger" text @click="removeRule(idx)">删除</el-button>
        </div>

        <div class="row">
          <el-select v-model="rule.actions[0].animation.value" placeholder="动画" @change="syncLabel(rule)">
            <el-option v-for="a in animationOptions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>

          <el-input-number v-model="rule.actions[0].animation.duration" :min="0" :step="0.1" @change="record" />
          <span class="unit">秒</span>

          <el-input-number v-model="rule.actions[0].animation.delay" :min="0" :step="0.1" @change="record" />
          <span class="unit">延迟</span>

          <el-input-number
            v-if="rule.actions[0].animation.iterationCount !== 'infinite'"
            v-model="rule.actions[0].animation.iterationCount"
            :min="1"
            :step="1"
            @change="record"
          />
          <el-select
            v-else
            v-model="rule.actions[0].animation.iterationCount"
            style="width: 100px"
            @change="record"
          >
            <el-option label="无限" value="infinite" />
          </el-select>

          <el-checkbox v-model="infiniteFlags[rule.id]" @change="toggleInfinite(rule)">无限</el-checkbox>
        </div>
      </div>

      <el-button style="width: 100%" @click="addRule">添加订阅</el-button>
    </div>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import generateID from '@/utils/generateID'
import { ANIMATION_PRESETS } from '@/constants/animations'
import type { Animation, AnimationAction, SubscriptionRule, Component } from '@/types'
import { deepCopy } from '@/utils/common'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { curComponent, componentData } = storeToRefs(editorStore)

type RuleVM = SubscriptionRule & { actions: [AnimationAction] }

function defaultAnimation(): Animation {
  return { label: '渐显', value: 'fadeIn', duration: 1, delay: 0, iterationCount: 1 }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isAnimationAction(v: unknown): v is AnimationAction {
  return isRecord(v) && v.type === 'animation' && isRecord(v.animation)
}

function normalizeRule(rule: SubscriptionRule): RuleVM {
  const first = Array.isArray(rule.actions) ? rule.actions[0] : undefined
  if (!first || !isAnimationAction(first) || !first.animation) {
    ;(rule as RuleVM).actions = [{ type: 'animation', animation: defaultAnimation() }]
  }

  // 规范化规则字段（补齐缺失的 id / sourceId / eventType）
  if (!rule.id) rule.id = generateID()
  if (!rule.sourceId) rule.sourceId = ''
  if (!rule.eventType) rule.eventType = 'v-click'

  return rule as RuleVM
}

watch(
  curComponent,
  () => {
    if (!curComponent.value) return
    if (!curComponent.value.subscriptions) curComponent.value.subscriptions = []
    curComponent.value.subscriptions = curComponent.value.subscriptions.map((r) => normalizeRule(r))
  },
  { immediate: true },
)

const subscriptions = computed<RuleVM[]>(() => {
  return (curComponent.value?.subscriptions || []) as RuleVM[]
})

const sourceOptions = computed(() => {
  const selfId = curComponent.value?.id
  return componentData.value.filter((c) => c.id !== selfId)
})

const animationOptions = computed(() => {
  return ANIMATION_PRESETS
})

const infiniteFlags = reactive<Record<string, boolean>>({})
const lastSnapshot = ref<Component | null>(null)

function snapshotComponent(): Component | null {
  return curComponent.value ? deepCopy(curComponent.value) : null
}

watch(
  curComponent,
  () => {
    lastSnapshot.value = snapshotComponent()
  },
  { immediate: true }
)

function addRule() {
  if (!curComponent.value) return
  const rule: SubscriptionRule = {
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
  curComponent.value.subscriptions ||= []
  const normalized = normalizeRule(rule)
  curComponent.value.subscriptions.push(normalized)
  infiniteFlags[normalized.id] = normalized.actions[0].animation.iterationCount === 'infinite'
  record()
}

function removeRule(index: number) {
  if (!curComponent.value?.subscriptions) return
  const rule = curComponent.value.subscriptions[index]
  curComponent.value.subscriptions.splice(index, 1)
  if (rule) delete infiniteFlags[rule.id]
  record()
}

function toggleInfinite(rule: RuleVM) {
  const flag = !!infiniteFlags[rule.id]
  rule.actions[0].animation.iterationCount = flag ? 'infinite' : 1
  record()
}

function syncLabel(rule: RuleVM) {
  const val = rule.actions[0].animation.value
  const option = animationOptions.value.find((o) => o.value === val)
  rule.actions[0].animation.label = option?.label || val
  record()
}

function record() {
  const c = curComponent.value
  if (!c) return
  const before = lastSnapshot.value ?? snapshotComponent()
  const after = snapshotComponent()
  if (!before || !after) return
  historyStore.executeUpdate(c.id, before, after, 'update subscriptions')
  lastSnapshot.value = after
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

