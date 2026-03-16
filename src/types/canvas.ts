import type { Component } from './component'

export interface CanvasStyle {
  width: number
  height: number
  scale: number
  color: string
  opacity: number
  background: string
  fontSize: number
}

export interface AreaData {
  style: {
    top: number
    left: number
    width: number
    height: number
  }
  components: Component[]
}
