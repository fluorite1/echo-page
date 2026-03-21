import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deepCopy } from '@/utils/common'
import type { Component, ComponentAttrPatch } from '@/types'
import { extractBeforePatch } from '@/utils/componentPatch'
import { useEditorStore } from './editor'

export type CommandType = 'add' | 'delete' | 'update' | 'reorder' | 'batch'

export interface BaseCommand {
  type: CommandType
  label?: string
  do(): void
  undo(): void
}

export interface AddCommand extends BaseCommand {
  type: 'add'
  component: Component
  index: number
}

export interface DeleteCommand extends BaseCommand {
  type: 'delete'
  component: Component
  index: number
}

export interface UpdateCommand extends BaseCommand {
  type: 'update'
  id: string
  beforePatch: ComponentAttrPatch
  afterPatch: ComponentAttrPatch
}

export interface ReorderCommand extends BaseCommand {
  type: 'reorder'
  from: number
  to: number
}

export interface BatchCommand extends BaseCommand {
  type: 'batch'
  children: HistoryCommand[]
}

export type HistoryCommand =
  | AddCommand
  | DeleteCommand
  | UpdateCommand
  | ReorderCommand
  | BatchCommand

const MAX_HISTORY = 100

export const useHistoryStore = defineStore('history', () => {
  const editorStore = useEditorStore()

  const done = ref<HistoryCommand[]>([])
  const undone = ref<HistoryCommand[]>([])

  const canUndo = computed(() => done.value.length > 0)
  const canRedo = computed(() => undone.value.length > 0)

  function trimDone() {
    if (done.value.length <= MAX_HISTORY) return
    done.value = done.value.slice(done.value.length - MAX_HISTORY)
  }

  function execute(cmd: HistoryCommand) {
    // 线性历史：一旦产生新命令，清空 redo 栈
    undone.value = []

    cmd.do()
    done.value.push(cmd)
    trimDone()
  }

  function undo() {
    const cmd = done.value.pop()
    if (!cmd) return
    cmd.undo()
    undone.value.push(cmd)
  }

  function redo() {
    const cmd = undone.value.pop()
    if (!cmd) return
    cmd.do()
    done.value.push(cmd)
    trimDone()
  }

  function clear() {
    done.value = []
    undone.value = []
  }

  // ---------- 命令构造器 ----------

  function createAddCommand(
    component: Component,
    index = editorStore.componentData.length,
    label?: string,
  ): AddCommand {
    const snapshot = deepCopy(component)
    return {
      type: 'add',
      label,
      component: snapshot,
      index,
      do() {
        editorStore.addComponent(deepCopy(snapshot), index)
      },
      undo() {
        editorStore.deleteComponent(index)
      },
    }
  }

  function createDeleteCommand(index: number, label?: string): DeleteCommand | null {
    const component = editorStore.getComponentByIndex(index)
    if (!component) return null
    const snapshot = deepCopy(component)
    return {
      type: 'delete',
      label,
      component: snapshot,
      index,
      do() {
        editorStore.deleteComponent(index)
      },
      undo() {
        editorStore.addComponent(deepCopy(snapshot), index)
      },
    }
  }

  function createDeleteCommandById(id: string, label?: string): DeleteCommand | null {
    const index = editorStore.findIndexById(id)
    return createDeleteCommand(index, label)
  }

  function createReorderCommand(from: number, to: number, label?: string): ReorderCommand {
    return {
      type: 'reorder',
      label,
      from,
      to,
      do() {
        editorStore.moveComponent(from, to)
      },
      undo() {
        editorStore.moveComponent(to, from)
      },
    }
  }

  function createBatchCommand(children: HistoryCommand[], label?: string): BatchCommand {
    const list = children.filter(Boolean)
    return {
      type: 'batch',
      label,
      children: list,
      do() {
        for (const c of list) c.do()
      },
      undo() {
        for (let i = list.length - 1; i >= 0; i--) list[i]!.undo()
      },
    }
  }

  function applyPatchById(id: string, patch: ComponentAttrPatch) {
    editorStore.updateComponentPropsById(id, patch)
  }

  function createPatchUpdateCommand(
    id: string,
    beforePatch: ComponentAttrPatch,
    afterPatch: ComponentAttrPatch,
    label?: string,
  ): UpdateCommand {
    return {
      type: 'update',
      label,
      id,
      beforePatch,
      afterPatch,
      do() {
        applyPatchById(id, afterPatch)
      },
      undo() {
        applyPatchById(id, beforePatch)
      },
    }
  }

  // ---------- 对外的“执行”API（只做局部命令，不做整页快照） ----------

  function executeAdd(component: Component, index?: number, label?: string) {
    execute(createAddCommand(component, index ?? editorStore.componentData.length, label))
  }

  function executeDeleteById(id: string, label?: string) {
    const cmd = createDeleteCommandById(id, label)
    if (!cmd) return
    execute(cmd)
  }

  /** 清空画布：视为一次批量 delete（仍属于 delete 类命令） */
  function executeClearCanvas(label?: string) {
    const list = editorStore.componentData
    if (list.length === 0) return

    // 从后往前删除：删除时 index 稳定；undo 逆序执行会按 0..n-1 依次插回
    const deletes: DeleteCommand[] = []
    for (let i = list.length - 1; i >= 0; i--) {
      deletes.push(createDeleteCommand(i) as DeleteCommand)
    }
    executeBatch(deletes, label ?? 'clear canvas')
  }

  function executeReorder(from: number, to: number, label?: string) {
    execute(createReorderCommand(from, to, label))
  }

  /** 批量执行（一次入栈）：do 顺序执行，undo 逆序执行 */
  function executeBatch(children: HistoryCommand[], label?: string) {
    const list = children.filter(Boolean)
    if (list.length === 0) return
    execute(createBatchCommand(list, label))
  }

  function executePatchUpdate(
    id: string,
    afterPatch: ComponentAttrPatch,
    label?: string,
    beforePatch?: ComponentAttrPatch,
  ) {
    const current = editorStore.getComponentById(id)
    if (!current) return

    const resolvedAfterPatch = deepCopy(afterPatch)
    const resolvedBeforePatch = beforePatch ?? extractBeforePatch(current, resolvedAfterPatch)

    execute(
      createPatchUpdateCommand(id, resolvedBeforePatch, resolvedAfterPatch, label),
    )
  }

  return {
    // state
    done,
    undone,
    canUndo,
    canRedo,
    // stack ops
    execute,
    undo,
    redo,
    clear,
    // commands
    executeAdd,
    executeDeleteById,
    executeClearCanvas,
    executeReorder,
    executePatchUpdate,
  }
})
