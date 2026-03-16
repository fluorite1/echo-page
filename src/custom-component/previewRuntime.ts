import mitt from 'mitt'
import { runAnimation } from '@/utils/runAnimation'
import { COMPONENT_DOM_ID_PREFIX } from '@/constants/dom'
import type { Component, PreviewEventType, SubscriptionRule } from '@/types'

type TriggerKey = string

export interface PreviewRuntime {
  /** 触发源组件调用：告诉执行器“我触发了某事件” */
  emit(eventType: PreviewEventType, sourceId: string): void
  /** 释放预览期资源（解绑事件、清定时器、清动画 class 等） */
  dispose(): void
}

/**
 * 预览期事件运行时：
 * - 从 schema（组件数组）编译出 triggerKey -> actions 的路由表
 * - 监听 v-click / v-hover 触发并执行动画动作
 * - dispose 时清理资源
 */
export function createPreviewRuntime(schema: Component[]): PreviewRuntime {
  const bus = mitt<Record<TriggerKey, void>>()
  const registrations: Array<{ key: TriggerKey; handler: () => void }> = []
  const cleanupFns: Array<() => void> = []
  const timers: number[] = []

  function makeKey(sourceId: string, eventType: PreviewEventType): TriggerKey {
    return `${sourceId}::${eventType}`
  }

  function registerSubscriptions() {
    schema.forEach((target) => {
      const subs = (target.subscriptions || []) as SubscriptionRule[]
      subs.forEach((sub) => {
        if (!sub?.id || !sub.sourceId || !sub.eventType) return

        const action = sub.actions?.find((a) => a.type === 'animation')
        if (!action) return

        const key = makeKey(sub.sourceId, sub.eventType)
        const handler = () => {
          const el = document.getElementById(COMPONENT_DOM_ID_PREFIX + target.id) as HTMLElement | null
          if (!el) return
          const cleanup = runAnimation(el, action.animation, timers)
          cleanupFns.push(cleanup)
        }

        bus.on(key, handler)
        registrations.push({ key, handler })
      })
    })
  }

  function dispose() {
    registrations.forEach(({ key, handler }) => bus.off(key, handler))
    registrations.length = 0
    cleanupFns.forEach((fn) => fn())
    cleanupFns.length = 0
    timers.forEach((t) => clearTimeout(t))
    timers.length = 0
  }

  function normalizeUrl(url: string): string {
    const trimmed = url.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  function runSelfActions(eventType: PreviewEventType, sourceId: string) {
    const source = schema.find((c) => c.id === sourceId)
    if (!source) return

    // 1) 自身触发动画（简化版）
    const anim = source.triggerAnimations?.[eventType]
    if (anim) {
      const el = document.getElementById(COMPONENT_DOM_ID_PREFIX + sourceId) as HTMLElement | null
      if (el) {
        const cleanup = runAnimation(el, anim, timers)
        cleanupFns.push(cleanup)
      }
    }

    // 2) 点击事件（alert / redirect）
    if (eventType === 'v-click' && source.events) {
      const alertText = source.events.alert
      if (alertText) {
        window.alert(alertText)
      }

      const url = source.events.redirect
      if (url) {
        window.location.href = normalizeUrl(url)
      }
    }
  }

  function emit(eventType: PreviewEventType, sourceId: string) {
    runSelfActions(eventType, sourceId)
    const key = makeKey(sourceId, eventType)
    bus.emit(key)
  }

  registerSubscriptions()

  return { emit, dispose }
}

