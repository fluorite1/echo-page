export interface AnimationPreset {
  label: string
  value: string
}

/**
 * 教学项目：常用动画预设（与 styles/animate.scss 的小动画集保持一致）
 */
export const ANIMATION_PRESETS: AnimationPreset[] = [
  { label: '渐显 fadeIn', value: 'fadeIn' },
  { label: '上滑进入 fadeInUp', value: 'fadeInUp' },
  { label: '下滑进入 fadeInDown', value: 'fadeInDown' },
  { label: '缩放进入 zoomIn', value: 'zoomIn' },
  { label: '上滑进入 slideInUp', value: 'slideInUp' },
  { label: '强调 pulse', value: 'pulse' },
  { label: '弹跳 bounce', value: 'bounce' },
  { label: '抖动 shake', value: 'shake' },
  { label: '晃动 tada', value: 'tada' },
]

