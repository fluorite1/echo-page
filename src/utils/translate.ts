export function toPercent(val: number): string {
  return `${val * 100}%`
}

export function changeStyleWithScale(value: number, scale: number): number {
  return (value * parseInt(String(scale))) / 100
}
