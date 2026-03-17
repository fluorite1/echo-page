import type { ComponentStyle } from '@/types'

interface PointInfo {
  center: { x: number; y: number }
  curPoint: { x: number; y: number }
  symmetricPoint: { x: number; y: number }
}

type CalculateFunc = (
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
) => void

const funcs: Record<string, CalculateFunc> = {
  lt: calculateLeftTop,
  t: calculateTop,
  rt: calculateRightTop,
  r: calculateRight,
  rb: calculateRightBottom,
  b: calculateBottom,
  lb: calculateLeftBottom,
  l: calculateLeft,
}

function applySize(
  style: ComponentStyle,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  if (width > 0 && height > 0) {
    style.width = Math.round(width)
    style.height = Math.round(height)
    style.left = Math.round(left)
    style.top = Math.round(top)
  }
}

function calculateLeftTop(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const width = symmetricPoint.x - curPosition.x
  const height = symmetricPoint.y - curPosition.y

  applySize(style, symmetricPoint.x - width, symmetricPoint.y - height, width, height)
}

function calculateRightTop(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const width = curPosition.x - symmetricPoint.x
  const height = symmetricPoint.y - curPosition.y

  applySize(style, symmetricPoint.x, symmetricPoint.y - height, width, height)
}

function calculateRightBottom(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const width = curPosition.x - symmetricPoint.x
  const height = curPosition.y - symmetricPoint.y

  applySize(style, symmetricPoint.x, symmetricPoint.y, width, height)
}

function calculateLeftBottom(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const width = symmetricPoint.x - curPosition.x
  const height = curPosition.y - symmetricPoint.y

  applySize(style, symmetricPoint.x - width, symmetricPoint.y, width, height)
}

function calculateTop(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const height = symmetricPoint.y - curPosition.y
  const width = style.width
  const left = style.left

  applySize(style, left, symmetricPoint.y - height, width, height)
}

function calculateRight(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const width = curPosition.x - symmetricPoint.x
  const height = style.height
  const top = style.top

  applySize(style, symmetricPoint.x, top, width, height)
}

function calculateBottom(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const height = curPosition.y - symmetricPoint.y
  const width = style.width
  const left = style.left

  applySize(style, left, symmetricPoint.y, width, height)
}

function calculateLeft(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const { symmetricPoint } = pointInfo
  const width = symmetricPoint.x - curPosition.x
  const height = style.height
  const top = style.top

  applySize(style, symmetricPoint.x - width, top, width, height)
}

export default function calculateComponentPositionAndSize(
  name: string,
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  pointInfo: PointInfo,
): void {
  const func = funcs[name]
  if (func) {
    func(style, curPosition, pointInfo)
  }
}
