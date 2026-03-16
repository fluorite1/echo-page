import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deepCopy } from '@/utils/common'
import type { Component, ComponentStyle } from '@/types'
import { useEditorStore } from './editor'

export type CommandType = 'add' | 'delete' | 'update' | 'reorder'

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
  before: ComponentPatch
  after: ComponentPatch
}

export interface ReorderCommand extends BaseCommand {
  type: 'reorder'
  id: string
  from: number
  to: number
}

export type HistoryCommand = AddCommand | DeleteCommand | UpdateCommand | ReorderCommand

const MAX_HISTORY = 100

export type ComponentPatch = Omit<Partial<Component>, 'style'> & { style?: Partial<ComponentStyle> }

function applyComponentPatch(target: Component, patch: ComponentPatch) {
  // style 需要合并（否则会丢失未涉及字段）
  if (patch.style) {
    Object.assign(target.style, patch.style)
  }

  // 其它字段采用替换语义（数据量较小、语义直观）
  const rest = { ...patch } as Omit<ComponentPatch, 'style'> & { style?: never }
  delete (rest as any).style
  Object.assign(target, rest)
}

export const useHistoryStore = defineStore('history', () => {
  const editorStore = useEditorStore()

  const done = ref<HistoryCommand[]>([])
  const undone = ref<HistoryCommand[]>([])

  // 用于高频交互：先 beginUpdate，再在交互结束时 commitUpdate
  const pendingUpdate = ref<{
    id: string
    before: ComponentPatch
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

  // ---------- 命令构造器（教学项目：集中在这里，调用方更清爽） ----------

  function createAddCommand(component: Component, index = editorStore.componentData.length, label?: string): AddCommand {
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
        editorStore.removeComponentById(snapshot.id)
      },
    }
  }

  function createDeleteCommandById(id: string, label?: string): DeleteCommand | null {
    const index = editorStore.findIndexById(id)
    const component = editorStore.getComponentById(id)
    if (index < 0 || !component) return null

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

  function createReorderCommand(id: string, from: number, to: number, label?: string): ReorderCommand {
    return {
      type: 'reorder',
      label,
      id,
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

  function createUpdateCommand(id: string, before: ComponentPatch, after: ComponentPatch, label?: string): UpdateCommand {
    const beforeCopy = deepCopy(before)
    const afterCopy = deepCopy(after)
    return {
      type: 'update',
      label,
      id,
      before: beforeCopy,
      after: afterCopy,
      do() {
        const target = editorStore.getComponentById(id)
        if (!target) return
        applyComponentPatch(target, afterCopy)
      },
      undo() {
        const target = editorStore.getComponentById(id)
        if (!target) return
        applyComponentPatch(target, beforeCopy)
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
    const before = deepCopy(editorStore.componentData)
    if (before.length === 0) return
    const cmd: DeleteCommand = {
      type: 'delete',
      label,
      component: deepCopy(before[0]!),
      index: -1,
      do() {
        editorStore.setComponentData([])
        editorStore.setCurComponent(null, null)
      },
      undo() {
        editorStore.setComponentData(deepCopy(before))
      },
    }
    execute(cmd)
  }

  function executeReorder(id: string, from: number, to: number, label?: string) {
    execute(createReorderCommand(id, from, to, label))
  }

  // 高频交互：begin/commit
  function beginUpdate(id: string, before: Partial<Component>, label?: string) {
    pendingUpdate.value = { id, before: deepCopy(before as ComponentPatch), label }
  }

  function commitUpdate(after: Partial<Component>) {
    const p = pendingUpdate.value
    if (!p) return
    pendingUpdate.value = null

    const cmd = createUpdateCommand(p.id, p.before, after as ComponentPatch, p.label)
    execute(cmd)
  }

  function cancelPendingUpdate() {
    pendingUpdate.value = null
  }

  // 低频：直接一次性 update
  function executeUpdate(id: string, before: ComponentPatch, after: ComponentPatch, label?: string) {
    execute(createUpdateCommand(id, before, after, label))
  }

  function snapshotStyle(style: ComponentStyle) {
    return deepCopy(style) as ComponentStyle
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
    snapshotStyle,
  }
})

