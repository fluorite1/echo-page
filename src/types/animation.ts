/**
 * 动画类型定义。
 * 动画预设列表以 constants/animations.ts 的 ANIMATION_PRESETS 为准，便于教学时单一数据源。
 */
export interface AnimationClass {
  label: string
  value: string
  children?: AnimationClass[]
}
