import type { Component, ComponentStyle } from '@/types'

export function changeComponentSizeWithScale(component: Component, scale: number) {
  Object.keys(component.style).forEach((key) => {
    if (['width', 'height', 'top', 'left', 'fontSize', 'borderWidth'].includes(key)) {
      const value = component.style[key as keyof ComponentStyle]
      if (typeof value === 'number') {
        ;(component.style as any)[key] = (value * scale) / 100
      }
    }
  })
}

export function changeComponentsSizeWithScale(componentData: Component[], scale: number) {
  componentData.forEach((component) => {
    changeComponentSizeWithScale(component, scale)
  })
}
