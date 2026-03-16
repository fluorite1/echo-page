import type { ComponentStyle } from '@/types'

interface PointInfo {
  center: { x: number; y: number }
  curPoint: { x: number; y: number }
  symmetricPoint: { x: number; y: number }
}

type CalculateFunc = (
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
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

function applySize(style: ComponentStyle, left: number, top: number, width: number, height: number): void {
  if (width > 0 && height > 0) {
    style.width = Math.round(width)
    style.height = Math.round(height)
    style.left = Math.round(left)
    style.top = Math.round(top)
  }
}

function lockRatio(width: number, height: number, proportion: number): { width: number; height: number } {
  if (width / height > proportion) {
    width = height * proportion
  } else {
    height = width / proportion
  }

  return { width, height }
}

function calculateLeftTop(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let width = symmetricPoint.x - curPosition.x
  let height = symmetricPoint.y - curPosition.y

  if (needLockProportion) {
    const locked = lockRatio(width, height, proportion)
    width = locked.width
    height = locked.height
  }

  applySize(style, symmetricPoint.x - width, symmetricPoint.y - height, width, height)
}

function calculateRightTop(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let width = curPosition.x - symmetricPoint.x
  let height = symmetricPoint.y - curPosition.y

  if (needLockProportion) {
    const locked = lockRatio(width, height, proportion)
    width = locked.width
    height = locked.height
  }

  applySize(style, symmetricPoint.x, symmetricPoint.y - height, width, height)
}

function calculateRightBottom(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let width = curPosition.x - symmetricPoint.x
  let height = curPosition.y - symmetricPoint.y

  if (needLockProportion) {
    const locked = lockRatio(width, height, proportion)
    width = locked.width
    height = locked.height
  }

  applySize(style, symmetricPoint.x, symmetricPoint.y, width, height)
}

function calculateLeftBottom(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let width = symmetricPoint.x - curPosition.x
  let height = curPosition.y - symmetricPoint.y

  if (needLockProportion) {
    const locked = lockRatio(width, height, proportion)
    width = locked.width
    height = locked.height
  }

  applySize(style, symmetricPoint.x - width, symmetricPoint.y, width, height)
}

function calculateTop(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let height = symmetricPoint.y - curPosition.y
  let width = style.width
  let left = style.left

  if (needLockProportion) {
    width = height * proportion
    left = symmetricPoint.x - width / 2
  }

  applySize(style, left, symmetricPoint.y - height, width, height)
}

function calculateRight(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let width = curPosition.x - symmetricPoint.x
  let height = style.height
  let top = style.top

  if (needLockProportion) {
    height = width / proportion
    top = symmetricPoint.y - height / 2
  }

  applySize(style, symmetricPoint.x, top, width, height)
}

function calculateBottom(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let height = curPosition.y - symmetricPoint.y
  let width = style.width
  let left = style.left

  if (needLockProportion) {
    width = height * proportion
    left = symmetricPoint.x - width / 2
  }

  applySize(style, left, symmetricPoint.y, width, height)
}

function calculateLeft(
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let width = symmetricPoint.x - curPosition.x
  let height = style.height
  let top = style.top

  if (needLockProportion) {
    height = width / proportion
    top = symmetricPoint.y - height / 2
  }

  applySize(style, symmetricPoint.x - width, top, width, height)
}

export default function calculateComponentPositionAndSize(
  name: string,
  style: ComponentStyle,
  curPosition: { x: number; y: number },
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const func = funcs[name]
  if (func) {
    func(style, curPosition, proportion, needLockProportion, pointInfo)
  }
}
