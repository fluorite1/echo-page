import type { ComponentStyle, Component } from '@/types'
import { toPercent } from './translate'

/** 仅用于定位的样式键，传给子组件时排除（由外层 shape 控制宽高位置） */
export const LAYOUT_ONLY_STYLE_KEYS = ['width', 'height', 'top', 'left']

export function getShapeStyle(style: ComponentStyle): Record<string, string> {
  const result: Record<string, string> = {}
  ;['width', 'height', 'top', 'left'].forEach((attr) => {
    result[attr] = `${style[attr as keyof ComponentStyle]}px`
  })
  return result
}

/** 需要加 'px' 单位的样式键 */
const needUnit = ['fontSize', 'width', 'height', 'top', 'left', 'borderWidth', 'letterSpacing', 'borderRadius']

export function getSVGStyle(style: ComponentStyle, filter: string[] = []): Record<string, string | number> {
  const result: Record<string, string | number> = {}

  ;[
    'opacity',
    'width',
    'height',
    'top',
    'left',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textAlign',
    'color',
  ].forEach((key) => {
    if (!filter.includes(key)) {
      if (key === 'rotate') return
      const value = style[key as keyof ComponentStyle]
      if (value !== '' && value !== undefined) {
        result[key] = value

        if (needUnit.includes(key)) {
          result[key] = `${value}px`
        }
      }
    }
  })

  return result
}

export function getStyle(style: ComponentStyle, filter: string[] = []): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  Object.keys(style).forEach((key) => {
    if (!filter.includes(key)) {
      if (key === 'rotate') return
      const value = style[key as keyof ComponentStyle]
      if (value !== '' && value !== undefined) {
        result[key] = value

        if (needUnit.includes(key)) {
          result[key] = `${value}px`
        }
      }
    }
  })

  return result
}

/** 传给内部组件（如 VText、Picture）的样式：排除布局键，由外层 shape 控制位置与尺寸 */
export function getComponentStyle(style: ComponentStyle, filter = LAYOUT_ONLY_STYLE_KEYS): Record<string, string | number> {
  return getStyle(style, filter)
}

export function getComponentRect(style: ComponentStyle) {
  const rect = { ...style } as ComponentStyle & { right: number; bottom: number }
  rect.right = rect.left + rect.width
  rect.bottom = rect.top + rect.height
  return rect
}

/** 画布容器样式不直接使用的 key（宽高在模板里单独写 px） */
const canvasStyleFilterKeys = ['width', 'height']
export function getCanvasStyle(canvasStyleData: Record<string, any>): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  Object.keys(canvasStyleData)
    .filter((key) => !canvasStyleFilterKeys.includes(key))
    .forEach((key) => {
      result[key] = canvasStyleData[key]
      if (key === 'fontSize') {
        result[key] = `${canvasStyleData[key]}px`
      }
    })

  return result
}

export function createGroupStyle(groupComponent: Component): void {
  const parentStyle = groupComponent.style
  groupComponent.propValue.forEach((component: Component) => {
    if (!component.groupStyle || !Object.keys(component.groupStyle).length) {
      const style = { ...component.style }
      if (component.component.startsWith('SVG')) {
        component.groupStyle = getSVGStyle(style) as unknown as Partial<ComponentStyle>
      } else {
        component.groupStyle = getStyle(style) as unknown as Partial<ComponentStyle>
      }

      if (component.groupStyle) {
        component.groupStyle.left = toPercent((style.left - parentStyle.left) / parentStyle.width) as any
        component.groupStyle.top = toPercent((style.top - parentStyle.top) / parentStyle.height) as any
        component.groupStyle.width = toPercent(style.width / parentStyle.width) as any
        component.groupStyle.height = toPercent(style.height / parentStyle.height) as any
      }
    }
  })
}
