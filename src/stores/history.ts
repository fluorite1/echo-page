import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deepCopy } from '@/utils/common'
import type { Component } from '@/types'
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
  before: Component
  after: Component
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

  // 用于高频交互：先 beginUpdate，再在交互结束时 commitUpdate
  const pendingUpdate = ref<{
    id: string
    before: Component
    label?: string
  } | null>(null)

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
    pendingUpdate.value = null
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

  function createUpdateCommandById(
    id: string,
    before: Component,
    after: Component,
    label?: string,
  ): UpdateCommand {
    const beforeCopy = deepCopy(before)
    const afterCopy = deepCopy(after)
    return {
      type: 'update',
      label,
      id,
      before: beforeCopy,
      after: afterCopy,
      do() {
        editorStore.replaceComponentById(id, deepCopy(afterCopy))
      },
      undo() {
        editorStore.replaceComponentById(id, deepCopy(beforeCopy))
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

  // 高频交互：begin/commit
  function beginUpdate(id: string, before: Component, label?: string) {
    pendingUpdate.value = { id, before: deepCopy(before), label }
  }

  function commitUpdate(after: Component) {
    const p = pendingUpdate.value
    if (!p) return
    pendingUpdate.value = null

    const cmd = createUpdateCommandById(p.id, p.before, after, p.label)
    execute(cmd)
  }

  function cancelPendingUpdate() {
    pendingUpdate.value = null
  }

  // 低频：直接一次性 update
  function executeUpdate(id: string, before: Component, after: Component, label?: string) {
    execute(createUpdateCommandById(id, before, after, label))
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
    beginUpdate,
    commitUpdate,
    cancelPendingUpdate,
    executeUpdate,
  }
})
