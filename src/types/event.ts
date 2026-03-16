/**
 * 组件事件项类型。
 * 当前教学项目支持 v-click / v-hover 上的 alert、redirect，由 InteractionAttr 与 previewRuntime 使用。
 */
export interface EventItem {
  key: string
  label: string
  event: string
  param: string
}
