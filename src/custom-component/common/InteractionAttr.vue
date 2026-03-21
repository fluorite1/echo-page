<template>
  <el-collapse-item title="交互（预览生效）" name="interaction">
    <div class="interaction">
      <div class="section">
        <div class="title">点击触发</div>

        <el-form label-width="90px" size="small">
          <el-form-item label="动画">
            <el-select
              :model-value="clickAnimationValue"
              placeholder="不播放动画"
              @change="(v) => onChangeAnimation('v-click', String(v ?? ''))"
            >
              <el-option label="无" value="" />
              <el-option v-for="a in presets" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="clickAnimationValue" label="时长(秒)">
            <el-input-number
              :model-value="clickAnimation?.duration"
              :min="0"
              :step="0.1"
              @change="(v) => onChangeDuration('v-click', v)"
            />
          </el-form-item>
          <el-form-item v-if="clickAnimationValue" label="延迟(秒)">
            <el-input-number
              :model-value="clickAnimation?.delay"
              :min="0"
              :step="0.1"
              @change="(v) => onChangeDelay('v-click', v)"
            />
          </el-form-item>
          <el-form-item v-if="clickAnimationValue" label="次数">
            <el-select
              :model-value="clickIteration"
              style="width: 120px"
              @change="(v) => onChangeIteration('v-click', normalizeIteration(v))"
            >
              <el-option label="1" :value="1" />
              <el-option label="2" :value="2" />
              <el-option label="3" :value="3" />
              <el-option label="无限" value="infinite" />
            </el-select>
          </el-form-item>

          <el-form-item label="弹窗(alert)">
            <el-input
              v-model="alertTextDraft"
              placeholder="点击后弹窗内容（留空不触发）"
              @change="(value) => updateEvents('alert', value)"
            />
          </el-form-item>

          <el-form-item label="跳转(url)">
            <el-input
              v-model="redirectUrlDraft"
              placeholder="点击后跳转 URL（留空不触发）"
              @change="(value) => updateEvents('redirect', value)"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="section">
        <div class="title">悬浮触发</div>
        <el-form label-width="90px" size="small">
          <el-form-item label="动画">
            <el-select
              :model-value="hoverAnimationValue"
              placeholder="不播放动画"
              @change="(v) => onChangeAnimation('v-hover', String(v ?? ''))"
            >
              <el-option label="无" value="" />
              <el-option v-for="a in presets" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="hoverAnimationValue" label="时长(秒)">
            <el-input-number
              :model-value="hoverAnimation?.duration"
              :min="0"
              :step="0.1"
              @change="(v) => onChangeDuration('v-hover', v)"
            />
          </el-form-item>
          <el-form-item v-if="hoverAnimationValue" label="延迟(秒)">
            <el-input-number
              :model-value="hoverAnimation?.delay"
              :min="0"
              :step="0.1"
              @change="(v) => onChangeDelay('v-hover', v)"
            />
          </el-form-item>
          <el-form-item v-if="hoverAnimationValue" label="次数">
            <el-select
              :model-value="hoverIteration"
              style="width: 120px"
              @change="(v) => onChangeIteration('v-hover', normalizeIteration(v))"
            >
              <el-option label="1" :value="1" />
              <el-option label="2" :value="2" />
              <el-option label="3" :value="3" />
              <el-option label="无限" value="infinite" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ANIMATION_PRESETS } from '@/constants/animations'
import type { Animation, Component, ComponentAttrChange, PreviewEventType } from '@/types'
import { deepCopy, isJSONEqual } from '@/utils/common'

const props = defineProps<{
  component: Component
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const presets = ANIMATION_PRESETS

function createTriggerAnimationsPatch(
  eventType: PreviewEventType,
  value: string,
): Component['triggerAnimations'] {
  const next = deepCopy(props.component.triggerAnimations ?? {})
  if (!value) {
    delete next[eventType]
    return next
  }
  const label = presets.find((p) => p.value === value)?.label || value
  const existing = next[eventType]
  next[eventType] = {
    label,
    value,
    duration: existing?.duration ?? 1,
    delay: existing?.delay ?? 0,
    iterationCount: existing?.iterationCount ?? 1,
  }
  return next
}

const clickAnimation = computed<Animation | undefined>(() => props.component.triggerAnimations?.['v-click'])
const hoverAnimation = computed<Animation | undefined>(() => props.component.triggerAnimations?.['v-hover'])
const clickAnimationValue = computed<string>(() => clickAnimation.value?.value || '')
const hoverAnimationValue = computed<string>(() => hoverAnimation.value?.value || '')
const clickIteration = computed<number | 'infinite'>(() =>
  normalizeIteration(clickAnimation.value?.iterationCount),
)
const hoverIteration = computed<number | 'infinite'>(() =>
  normalizeIteration(hoverAnimation.value?.iterationCount),
)

function normalizeIteration(v: unknown): number | 'infinite' {
  if (v === 'infinite') return 'infinite'
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

const alertTextDraft = ref('')
const redirectUrlDraft = ref('')

watch(
  () => props.component.events,
  (events) => {
    alertTextDraft.value = events?.alert ?? ''
    redirectUrlDraft.value = events?.redirect ?? ''
  },
  { immediate: true, deep: true },
)

function onChangeAnimation(eventType: PreviewEventType, value: string) {
  const nextTriggerAnimations = createTriggerAnimationsPatch(eventType, value)
  if (isJSONEqual(nextTriggerAnimations, props.component.triggerAnimations ?? {})) return

  emit('change', {
    patch: {
      triggerAnimations: nextTriggerAnimations,
    },
    label: 'update interaction config',
  })
}

function onChangeDuration(eventType: PreviewEventType, value: number | undefined) {
  updateAnimationField(eventType, 'duration', value ?? 0)
}

function onChangeDelay(eventType: PreviewEventType, value: number | undefined) {
  updateAnimationField(eventType, 'delay', value ?? 0)
}

function onChangeIteration(eventType: PreviewEventType, value: number | 'infinite') {
  updateAnimationField(eventType, 'iterationCount', value)
}

function updateAnimationField<K extends keyof Animation>(
  eventType: PreviewEventType,
  key: K,
  value: Animation[K],
) {
  const current =
    props.component.triggerAnimations?.[eventType] ??
    createTriggerAnimationsPatch(eventType, presets[0]?.value || 'fadeIn')?.[eventType]
  if (!current) return

  const next = deepCopy(props.component.triggerAnimations ?? {})
  next[eventType] = {
    ...current,
    [key]: value,
  }

  if (isJSONEqual(next, props.component.triggerAnimations ?? {})) return

  emit('change', {
    patch: { triggerAnimations: next },
    label: 'update interaction config',
  })
}

function updateEvents(key: string, value: string) {
  const next = deepCopy(props.component.events ?? {})
  const trimmed = value.trim()
  if (trimmed) {
    next[key] = trimmed
  } else {
    delete next[key]
  }

  if (isJSONEqual(next, props.component.events ?? {})) return

  emit('change', {
    patch: { events: next },
    label: 'update interaction config',
  })
}
</script>

<style scoped lang="scss">
.interaction {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.section {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px;
  background: var(--main-bg-color);
}

.title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-color);
}
</style>
