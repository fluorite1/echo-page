import { deepCopy } from '@/utils/common'
import type { Component, ComponentAttrKey, ComponentAttrPatch } from '@/types'

function clonePatchValue<T>(value: T): T {
  return value === undefined ? value : deepCopy(value)
}

function getPatchKey(patch: ComponentAttrPatch): ComponentAttrKey {
  return Object.keys(patch)[0] as ComponentAttrKey
}

export function extractBeforePatch(component: Component, patch: ComponentAttrPatch): ComponentAttrPatch {
  const componentRecord = component as unknown as Record<string, unknown>
  const key = getPatchKey(patch)
  return {
    [key]: clonePatchValue(componentRecord[key]),
  } as ComponentAttrPatch
}
