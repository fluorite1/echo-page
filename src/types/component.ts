export interface ComponentStyle {
  top: number
  left: number
  width: number
  height: number
  rotate?: number
  opacity?: number
  fontSize?: number
  fontWeight?: number
  lineHeight?: string
  letterSpacing?: number
  textAlign?: string
  color?: string
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderRadius?: string
  borderStyle?: string
  padding?: number
  verticalAlign?: string
}

export interface Animation {
  label: string
  value: string
  duration: number
  delay: number
  iterationCount: number | 'infinite'
}

export interface ComponentEvent {
  [key: string]: string
}

export type PreviewEventType = 'v-click' | 'v-hover'

export interface AnimationAction {
  type: 'animation'
  animation: Animation
}

export interface SubscriptionRule {
  /** rule id，用于去重/删除 */
  id: string
  /** 监听的组件 id（触发源） */
  sourceId: string
  /** 监听的事件类型 */
  eventType: PreviewEventType
  /** 当前组件（目标组件）要执行的动作列表 */
  actions: AnimationAction[]
}

export interface RequestConfig {
  method: 'GET' | 'POST'
  data: any[]
  url: string
  series: boolean
  time: number
  paramType: string
  requestCount: number
}

export interface Component {
  id: string
  component: string
  label: string
  icon: string
  propValue: any
  style: ComponentStyle
  animations: Animation[]
  events: ComponentEvent
  /**
   * 预览期：组件自身交互触发的动画（简化版）
   * - v-click：点击自身播放
   * - v-hover：悬浮自身播放
   */
  triggerAnimations?: Partial<Record<PreviewEventType, Animation>>
  /** 预览期事件订阅规则（挂在目标组件上） */
  subscriptions?: SubscriptionRule[]
  groupStyle?: Partial<ComponentStyle>
  request?: RequestConfig
  collapseName?: string
}
