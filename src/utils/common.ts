export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function $(selector: string): HTMLElement | null {
  return document.querySelector(selector)
}

/** 拖拽到画布时需阻止默认放置的组件（由内部逻辑处理），避免与画布 drop 冲突 */
export function isPreventDrop(component: string): boolean {
  return ['VText', 'RectShape', 'CircleShape'].includes(component)
}
