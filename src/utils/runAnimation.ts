import type { Animation } from '@/types'

/**
 * 运行 animate.css(v3) 动画：class = "animated" + 动画名（如 fadeIn）。
 * 会用 reflow 重新触发同名动画。
 *
 * @returns cleanup 函数（会移除 class/inline style，并清理定时器）
 */
export function runAnimation(el: HTMLElement, animation: Animation, timers: number[] = []): () => void {
  const name = animation.value
  if (!name) return () => {}

  // 先清理上一次的同名动画，避免不触发
  el.classList.remove('animated', name, 'infinite')

  // 强制 reflow 让动画重置生效
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void el.offsetWidth

  el.style.animationDuration = `${animation.duration || 0}s`
  el.style.animationDelay = `${animation.delay || 0}s`

  if (animation.iterationCount === 'infinite') {
    el.classList.add('infinite')
    el.style.animationIterationCount = 'infinite'
  } else {
    el.style.animationIterationCount = String(animation.iterationCount ?? 1)
  }

  el.classList.add('animated', name)

  const cleanup = () => {
    el.classList.remove('animated', name, 'infinite')
    el.style.animationDuration = ''
    el.style.animationDelay = ''
    el.style.animationIterationCount = ''
  }

  // 非 infinite：结束后自动清理 class，避免一直保持在 animated 状态
  if (animation.iterationCount !== 'infinite') {
    const totalMs =
      ((animation.delay || 0) + (animation.duration || 0)) * 1000 * Math.max(1, Number(animation.iterationCount || 1))
    const t = window.setTimeout(cleanup, Math.max(0, totalMs))
    timers.push(t)
  }

  return cleanup
}

