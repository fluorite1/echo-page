import { runAnimation } from '@/utils/runAnimation'
import type { Component, PreviewEventType, AnimationAction } from '@/types'

type TriggerKey = string
type ActionHandler = () => void

export interface ActionContext {
  sourceId: string
  targetId: string
  targetEl: HTMLElement | null
}

export interface PreviewRuntime {
  on(eventType: PreviewEventType, sourceId: string, handler: ActionHandler): () => void
  emit(eventType: PreviewEventType, sourceId: string): void
  executeAction(action: AnimationAction, ctx: ActionContext): void
  runSelfActions(source: Component, eventType: PreviewEventType, targetEl: HTMLElement | null): void
  clearTarget(targetId: string): void
  /** 释放预览期资源（清动画 class / 事件订阅） */
  dispose(): void
}

/**
 * 预览期事件运行时：
 * - 作为轻量事件中心，供 PreviewNode 在挂载时注册订阅
 * - 动作统一走 executeAction，避免执行逻辑散落在节点里
 * - 按目标组件覆盖管理 cleanup，避免长期预览时资源无界累积
 */
export function createPreviewRuntime(): PreviewRuntime {
  const actionMap = new Map<TriggerKey, Set<ActionHandler>>()
  const activeCleanups = new Map<string, () => void>()

  function makeKey(sourceId: string, eventType: PreviewEventType): TriggerKey {
    return `${sourceId}::${eventType}`
  }

  function replaceCleanup(targetId: string, cleanup?: () => void) {
    const prev = activeCleanups.get(targetId)
    if (prev) {
      activeCleanups.delete(targetId)
      prev()
    }

    if (cleanup) {
      activeCleanups.set(targetId, cleanup)
    }
  }

  function on(eventType: PreviewEventType, sourceId: string, handler: ActionHandler): () => void {
    const key = makeKey(sourceId, eventType)
    const list = actionMap.get(key) ?? new Set<ActionHandler>()
    list.add(handler)
    actionMap.set(key, list)

    return () => {
      const current = actionMap.get(key)
      if (!current) return
      current.delete(handler)
      if (current.size === 0) {
        actionMap.delete(key)
      }
    }
  }

  function normalizeUrl(url: string): string {
    const trimmed = url.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  function executeAction(action: AnimationAction, ctx: ActionContext) {
    if (action.type !== 'animation') return
    if (!ctx.targetEl) return

    // 先停止旧动画，再启动新动画；否则旧 cleanup 会把刚启动的新动画一起清掉。
    replaceCleanup(ctx.targetId)

    let cleanupRef: (() => void) | undefined
    const cleanup = runAnimation(ctx.targetEl, action.animation, () => {
      if (cleanupRef && activeCleanups.get(ctx.targetId) === cleanupRef) {
        activeCleanups.delete(ctx.targetId)
      }
    })
    cleanupRef = cleanup
    activeCleanups.set(ctx.targetId, cleanup)
  }

  function runSelfActions(source: Component, eventType: PreviewEventType, targetEl: HTMLElement | null) {
    const anim = source.triggerAnimations?.[eventType]
    if (anim) {
      executeAction(
        { type: 'animation', animation: anim },
        { sourceId: source.id, targetId: source.id, targetEl },
      )
    }

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
    const key = makeKey(sourceId, eventType)
    const handlers = actionMap.get(key)
    if (!handlers?.size) return

    ;[...handlers].forEach((handler) => handler())
  }

  function clearTarget(targetId: string) {
    replaceCleanup(targetId)
  }

  function dispose() {
    actionMap.clear()
    activeCleanups.forEach((cleanup) => cleanup())
    activeCleanups.clear()
  }

  return {
    on,
    emit,
    executeAction,
    runSelfActions,
    clearTarget,
    dispose,
  }
}
