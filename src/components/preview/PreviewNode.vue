<template>
  <div
    ref="selfEl"
    class="shape"
    :style="getShapeStyle(item.style)"
    @click="onTrigger('v-click')"
    @mouseenter="onTrigger('v-hover')"
  >
    <component
      :is="item.component"
      class="component"
      :style="getComponentStyle(item.style)"
      :prop-value="item.propValue"
      :element="item"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getShapeStyle, getComponentStyle } from '@/utils/style'
import type { AnimationAction, Component, PreviewEventType, SubscriptionRule } from '@/types'
import type { PreviewRuntime } from '@/custom-component/previewRuntime'

defineOptions({
  name: 'PreviewNode',
})

const props = defineProps<{
  item: Component
  runtime: PreviewRuntime
}>()

const selfEl = ref<HTMLElement | null>(null)
const unsubscribers: Array<() => void> = []

function getFirstAnimationAction(sub: SubscriptionRule): AnimationAction | undefined {
  return sub.actions?.find((action) => action.type === 'animation')
}

function registerSubscriptions() {
  const subs = props.item.subscriptions || []

  subs.forEach((sub) => {
    if (!sub?.id || !sub.sourceId || !sub.eventType) return

    const action = getFirstAnimationAction(sub)
    if (!action) return

    const off = props.runtime.on(sub.eventType, sub.sourceId, () => {
      props.runtime.executeAction(action, {
        sourceId: sub.sourceId,
        targetId: props.item.id,
        targetEl: selfEl.value,
      })
    })

    unsubscribers.push(off)
  })
}

function onTrigger(eventType: PreviewEventType) {
  props.runtime.runSelfActions(props.item, eventType, selfEl.value)
  props.runtime.emit(eventType, props.item.id)
}

onMounted(() => {
  registerSubscriptions()
})

onBeforeUnmount(() => {
  unsubscribers.forEach((off) => off())
  unsubscribers.length = 0
  props.runtime.clearTarget(props.item.id)
})
</script>

<style scoped lang="scss">
.shape {
  position: absolute;
}

.component {
  outline: none;
  width: 100%;
  height: 100%;
  user-select: none;
}
</style>
