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
              v-model="tableData[row][col]"
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
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { ElMessage } from 'element-plus'

const vFocus = {
  mounted(el: HTMLElement) {
    const input = el.querySelector('input')
    if (input) {
      input.focus()
    }
  },
}

const editorStore = useEditorStore()
const { curComponent } = storeToRefs(editorStore)

const curTd = ref('')
const canEdit = ref(false)
const preCurTd = ref('')

function parseTd(td: string): { row: number; col: number } | null {
  const [r, c] = td.split(',')
  const row = Number.parseInt(r ?? '', 10)
  const col = Number.parseInt(c ?? '', 10)
  if (Number.isNaN(row) || Number.isNaN(col)) return null
  return { row, col }
}

const tableData = computed(() => {
  if (curComponent.value && curComponent.value.propValue) {
    return (curComponent.value.propValue as any).data
  }
  return []
})

function onDblclick() {
  canEdit.value = true
}

function onClick(row: number, col: number) {
  curTd.value = `${row},${col}`
  preCurTd.value = curTd.value
}

function onBlur() {
  canEdit.value = false
  curTd.value = ''
}

function deleteRow() {
  const td = parseTd(preCurTd.value)
  if (!td) {
    ElMessage.error('请先选择要删除的行')
    return
  }

  tableData.value.splice(td.row, 1)
}

function addRow() {
  tableData.value.push(new Array(tableData.value[0]?.length || 1).fill(' '))
}

function addCol() {
  if (tableData.value.length) {
    tableData.value.forEach((item: string[]) => item.push(' '))
  } else {
    tableData.value.push([' '])
  }
}

function deleteCol() {
  const td = parseTd(preCurTd.value)
  if (!td) {
    ElMessage.error('请先选择要删除的列')
    return
  }

  tableData.value.forEach((item: string[]) => {
    item.splice(td.col, 1)
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
