<template>
  <el-collapse-item title="交互（预览生效）" name="interaction">
    <div class="interaction">
      <div class="section">
        <div class="title">点击触发</div>

        <el-form label-width="90px" size="small">
          <el-form-item label="动画">
            <el-select v-model="clickAnimationValue" placeholder="不播放动画" @change="onChangeAnimation('v-click')">
              <el-option label="无" value="" />
              <el-option v-for="a in presets" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="clickAnimationValue" label="时长(秒)">
            <el-input-number v-model="clickAnimation!.duration" :min="0" :step="0.1" @change="record" />
          </el-form-item>
          <el-form-item v-if="clickAnimationValue" label="延迟(秒)">
            <el-input-number v-model="clickAnimation!.delay" :min="0" :step="0.1" @change="record" />
          </el-form-item>
          <el-form-item v-if="clickAnimationValue" label="次数">
            <el-select v-model="clickIteration" style="width: 120px" @change="onChangeIteration('v-click')">
              <el-option label="1" :value="1" />
              <el-option label="2" :value="2" />
              <el-option label="3" :value="3" />
              <el-option label="无限" value="infinite" />
            </el-select>
          </el-form-item>

          <el-form-item label="弹窗(alert)">
            <el-input
              v-model="alertText"
              placeholder="点击后弹窗内容（留空不触发）"
            />
          </el-form-item>

          <el-form-item label="跳转(url)">
            <el-input
              v-model="redirectUrl"
              placeholder="点击后跳转 URL（留空不触发）"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="section">
        <div class="title">悬浮触发</div>
        <el-form label-width="90px" size="small">
          <el-form-item label="动画">
            <el-select v-model="hoverAnimationValue" placeholder="不播放动画" @change="onChangeAnimation('v-hover')">
              <el-option label="无" value="" />
              <el-option v-for="a in presets" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="hoverAnimationValue" label="时长(秒)">
            <el-input-number v-model="hoverAnimation!.duration" :min="0" :step="0.1" @change="record" />
          </el-form-item>
          <el-form-item v-if="hoverAnimationValue" label="延迟(秒)">
            <el-input-number v-model="hoverAnimation!.delay" :min="0" :step="0.1" @change="record" />
          </el-form-item>
          <el-form-item v-if="hoverAnimationValue" label="次数">
            <el-select v-model="hoverIteration" style="width: 120px" @change="onChangeIteration('v-hover')">
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
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { ANIMATION_PRESETS } from '@/constants/animations'
import type { Animation, PreviewEventType } from '@/types'
import { deepCopy } from '@/utils/common'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { curComponent } = storeToRefs(editorStore)

const presets = ANIMATION_PRESETS

type InteractionSnapshot = Pick<NonNullable<typeof curComponent.value>, 'triggerAnimations' | 'events'>
const lastSnapshot = ref<InteractionSnapshot | null>(null)

function snapshot(): InteractionSnapshot {
  const c = curComponent.value
  return {
    triggerAnimations: deepCopy(c?.triggerAnimations ?? {}),
    events: deepCopy(c?.events ?? {}),
  } as any
}

watch(
  curComponent,
  () => {
    lastSnapshot.value = snapshot()
  },
  { immediate: true }
)

function ensureTriggerAnimations() {
  if (!curComponent.value) return
  if (!curComponent.value.triggerAnimations) curComponent.value.triggerAnimations = {}
}

function ensureAnimation(eventType: PreviewEventType, value: string) {
  if (!curComponent.value) return
  ensureTriggerAnimations()
  if (!value) {
    delete curComponent.value.triggerAnimations![eventType]
    return
  }
  const label = presets.find((p) => p.value === value)?.label || value
  const existing = curComponent.value.triggerAnimations![eventType]
  curComponent.value.triggerAnimations![eventType] = {
    label,
    value,
    duration: existing?.duration ?? 1,
    delay: existing?.delay ?? 0,
    iterationCount: existing?.iterationCount ?? 1,
  }
}

const clickAnimation = computed<Animation | undefined>(() => curComponent.value?.triggerAnimations?.['v-click'])
const hoverAnimation = computed<Animation | undefined>(() => curComponent.value?.triggerAnimations?.['v-hover'])

const clickAnimationValue = computed<string>({
  get: () => clickAnimation.value?.value || '',
  set: (v) => ensureAnimation('v-click', v),
})
const hoverAnimationValue = computed<string>({
  get: () => hoverAnimation.value?.value || '',
  set: (v) => ensureAnimation('v-hover', v),
})

const clickIteration = computed<number | 'infinite'>({
  get: () => normalizeIteration(clickAnimation.value?.iterationCount),
  set: (v) => {
    if (clickAnimation.value) clickAnimation.value.iterationCount = v
  },
})
const hoverIteration = computed<number | 'infinite'>({
  get: () => normalizeIteration(hoverAnimation.value?.iterationCount),
  set: (v) => {
    if (hoverAnimation.value) hoverAnimation.value.iterationCount = v
  },
})

function normalizeIteration(v: unknown): number | 'infinite' {
  if (v === 'infinite') return 'infinite'
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

const alertText = computed<string>({
  get: () => curComponent.value?.events?.alert ?? '',
  set: (v) => {
    if (!curComponent.value) return
    if (!curComponent.value.events) curComponent.value.events = {}
    const trimmed = v.trim()
    if (trimmed) {
      curComponent.value.events.alert = trimmed
    } else {
      delete curComponent.value.events.alert
    }
    record()
  },
})

const redirectUrl = computed<string>({
  get: () => curComponent.value?.events?.redirect ?? '',
  set: (v) => {
    if (!curComponent.value) return
    if (!curComponent.value.events) curComponent.value.events = {}
    const trimmed = v.trim()
    if (trimmed) {
      curComponent.value.events.redirect = trimmed
    } else {
      delete curComponent.value.events.redirect
    }
    record()
  },
})

function onChangeAnimation(_eventType: PreviewEventType) {
  record()
}

function onChangeIteration(_eventType: PreviewEventType) {
  record()
}

function record() {
  const c = curComponent.value
  if (!c) return
  const before = lastSnapshot.value ?? snapshot()
  const after = snapshot()
  historyStore.executeUpdate(
    c.id,
    { triggerAnimations: before.triggerAnimations, events: before.events },
    { triggerAnimations: after.triggerAnimations, events: after.events },
    'update interaction config'
  )
  lastSnapshot.value = after
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

