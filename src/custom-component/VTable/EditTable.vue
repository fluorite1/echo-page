<template>
  <div class="edit-table">
    <table @dblclick="onDblclick">
      <tbody>
        <tr v-for="(item, row) in tableData" :key="row">
          <td
            v-for="(e, col) in item"
            :key="col"
            :class="{ selected: curTd === row + ',' + col }"
            @click="onClick(Number(row), Number(col))"
          >
            <el-input
              v-if="canEdit && curTd === row + ',' + col"
              v-model="editValue"
              v-focus
              @blur="onBlur"
            />
            <span v-else>{{ e }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <button @click="addRow">添加新行</button>
      <button @click="addCol">添加新列</button>
      <button @click="deleteRow">删除行</button>
      <button @click="deleteCol">删除列</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { deepCopy, isJSONEqual } from '@/utils/common'
import type { Component, ComponentAttrChange } from '@/types'

const vFocus = {
  mounted(el: HTMLElement) {
    const input = el.querySelector('input')
    if (input) {
      input.focus()
    }
  },
}

const props = defineProps<{
  component: Component
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const curTd = ref('')
const canEdit = ref(false)
const preCurTd = ref('')
const editValue = ref('')

function parseTd(td: string): { row: number; col: number } | null {
  const [r, c] = td.split(',')
  const row = Number.parseInt(r ?? '', 10)
  const col = Number.parseInt(c ?? '', 10)
  if (Number.isNaN(row) || Number.isNaN(col)) return null
  return { row, col }
}

const tableData = computed(() => {
  if (props.component.propValue) {
    return (props.component.propValue as any).data
  }
  return []
})

function onDblclick() {
  const td = parseTd(curTd.value)
  if (!td) return
  canEdit.value = true
  editValue.value = tableData.value[td.row]?.[td.col] ?? ''
}

function onClick(row: number, col: number) {
  curTd.value = `${row},${col}`
  preCurTd.value = curTd.value
}

function onBlur() {
  const td = parseTd(preCurTd.value)
  canEdit.value = false
  curTd.value = ''
  if (!td) return

  const next = createNextTableValue()
  next.data[td.row] ||= []
  next.data[td.row][td.col] = editValue.value
  emitTableChange(next, 'table cell edit')
}

function deleteRow() {
  const td = parseTd(preCurTd.value)
  if (!td) {
    ElMessage.error('请先选择要删除的行')
    return
  }

  const next = createNextTableValue()
  next.data.splice(td.row, 1)
  emitTableChange(next, 'table delete row')
}

function addRow() {
  const next = createNextTableValue()
  next.data.push(new Array(next.data[0]?.length || 1).fill(' '))
  emitTableChange(next, 'table add row')
}

function addCol() {
  const next = createNextTableValue()
  if (next.data.length) {
    next.data.forEach((item: string[]) => item.push(' '))
  } else {
    next.data.push([' '])
  }
  emitTableChange(next, 'table add col')
}

function deleteCol() {
  const td = parseTd(preCurTd.value)
  if (!td) {
    ElMessage.error('请先选择要删除的列')
    return
  }

  const next = createNextTableValue()
  next.data.forEach((item: string[]) => {
    item.splice(td.col, 1)
  })
  emitTableChange(next, 'table delete col')
}

function createNextTableValue() {
  const value = deepCopy(props.component.propValue ?? {})
  value.data = Array.isArray(value.data) ? value.data : []
  value.stripe = Boolean(value.stripe)
  value.thBold = Boolean(value.thBold)
  return value
}

function emitTableChange(nextValue: Record<string, unknown>, label: string) {
  if (isJSONEqual(nextValue, createNextTableValue())) return

  emit('change', {
    patch: { propValue: nextValue },
    label,
  })
}
</script>

<style lang="scss" scoped>
.edit-table {
  overflow: auto;
  margin-bottom: 8px;

  & > div {
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    button {
      cursor: pointer;
      background: #fff;
      border: 1px solid #dcdfe6;
      color: #606266;
      text-align: center;
      box-sizing: border-box;
      outline: 0;
      margin: 0;
      font-weight: 500;
      padding: 4px 10px;
      font-size: 14px;
      border-radius: 4px;
      margin-bottom: 10px;

      &:hover {
        background: #ecf5ff;
        color: #409eff;
      }
    }
  }

  table {
    border-collapse: collapse;
    word-break: break-all;
    word-wrap: break-word;
    text-align: center;
    font-size: 12px;

    td {
      border: 1px solid #ebeef5;
      height: 40px;
      min-width: 60px;
      max-width: 80px;
      padding: 10px;
    }
  }

  .selected {
    background: #ecf5ff;
    color: #409eff;
  }
}
</style>
