import type { Component } from '@/types'
import { $ } from './common'
import { COMPONENT_DOM_ID_PREFIX } from '@/constants/dom'

export default function decomposeComponent(
  component: Component,
  editorRect: DOMRect,
  parentStyle: Component['style']
): void {
  const componentRect = $(`#${COMPONENT_DOM_ID_PREFIX}${component.id}`)?.getBoundingClientRect()
  if (!componentRect) return

  const center = {
    x: componentRect.left - editorRect.left + componentRect.width / 2,
    y: componentRect.top - editorRect.top + componentRect.height / 2,
  }

  if (component.groupStyle) {
    component.style.width = (parseFloat(String(component.groupStyle.width)) / 100) * parentStyle.width
    component.style.height = (parseFloat(String(component.groupStyle.height)) / 100) * parentStyle.height
    component.style.left = center.x - component.style.width / 2
    component.style.top = center.y - component.style.height / 2
    component.groupStyle = {} as Component['style']
  }
}
