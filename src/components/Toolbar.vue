<template>
  <div class="toolbar">
    <el-button @click="onImportJSON">导入</el-button>
    <el-button @click="onExportJSON">导出</el-button>
    <el-upload
      ref="imageUploadRef"
      class="upload"
      action="#"
      :show-file-list="false"
      :auto-upload="false"
      accept="image/*"
      :on-change="onImageChange"
    >
      <el-button>插入图片</el-button>
    </el-upload>

    <el-button @click="undo">撤销</el-button>
    <el-button @click="redo">重做</el-button>
    <el-button @click="preview">预览</el-button>
    <el-button @click="save">保存</el-button>
    <el-button @click="clearCanvas">清空画布</el-button>

    <div class="canvas-config">
      <span>画布大小</span>
      <input v-model="canvasStyleData.width" type="number" />
      <span>×</span>
      <input v-model="canvasStyleData.height" type="number" />
    </div>

    <el-dialog
      v-model="isShowDialog"
      :title="isExport ? '导出数据' : '导入数据'"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      width="600px"
    >
      <el-input v-model="jsonData" type="textarea" :rows="20" placeholder="请输入 JSON 数据" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="isShowDialog = false">取消</el-button>
          <el-upload
            v-if="!isExport"
            ref="jsonUploadRef"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            accept="application/json"
            :on-change="onJSONChange"
          >
            <el-button type="primary">选择 JSON 文件</el-button>
          </el-upload>
          <el-button type="primary" @click="processJSON">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppToolbar' })

import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import generateID from '@/utils/generateID'
import { deepCopy } from '@/utils/common'
import componentList from '@/custom-component/component-list'
import type { Component, CanvasStyle } from '@/types'
import { LOCAL_STORAGE_KEYS } from '@/constants/storage'

const router = useRouter()
const editorStore = useEditorStore()
const historyStore = useHistoryStore()

const { componentData, canvasStyleData } = storeToRefs(editorStore)

const isShowDialog = ref(false)
const jsonData = ref('')
const isExport = ref(false)

const imageUploadRef = ref<UploadInstance>()
const jsonUploadRef = ref<UploadInstance>()

function undo() {
  historyStore.undo()
}

function redo() {
  historyStore.redo()
}

function preview() {
  router.push({ name: 'Preview' })
}

function save() {
  localStorage.setItem(LOCAL_STORAGE_KEYS.CANVAS_DATA, JSON.stringify(componentData.value))
  localStorage.setItem(LOCAL_STORAGE_KEYS.CANVAS_STYLE, JSON.stringify(canvasStyleData.value))
  ElMessageBox.alert('保存成功', '提示', { type: 'success' })
}

function onImportJSON() {
  jsonData.value = ''
  isExport.value = false
  isShowDialog.value = true
}

function onExportJSON() {
  isExport.value = true
  isShowDialog.value = true
  const exportData = {
    componentData: componentData.value,
    canvasStyleData: canvasStyleData.value,
  }
  jsonData.value = JSON.stringify(exportData, null, 2)
}

function onJSONChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    jsonData.value = String(reader.result || '')
    // 允许重复选择同一文件也能触发
    jsonUploadRef.value?.clearFiles()
  }
  reader.readAsText(file)
}

function processJSON() {
  try {
    const data = JSON.parse(jsonData.value)

    if (isExport.value) {
      downloadFile(jsonData.value, 'application/json', 'data.json')
      return
    }

    // 导入仅支持标准格式：{ componentData: [], canvasStyleData?: {} }（与导出一致）
    const parsed = data as { componentData?: unknown; canvasStyleData?: unknown } | null
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.componentData)) {
      ElMessage.error('请使用标准格式：{ componentData: [], canvasStyleData?: {} }')
      return
    }
    const { componentData: list, canvasStyleData: style } = parsed as {
      componentData: Component[]
      canvasStyleData?: CanvasStyle
    }
    editorStore.setCurComponent(null, null)
    editorStore.setComponentData(list)
    if (style && typeof style === 'object') {
      editorStore.setCanvasStyle(style)
    }

    // 导入：清空历史，以当前导入结果为基线
    historyStore.clear()
    isShowDialog.value = false
    ElMessage.success('导入成功')
  } catch {
    ElMessage.error('数据格式错误，请传入合法的 JSON 格式数据')
  }
}

function downloadFile(data: string, type: string, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

function onImageChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return

  if (!file.type.includes('image')) {
    ElMessage.error('只能插入图片')
    imageUploadRef.value?.clearFiles()
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const fileResult = String(reader.result || '')
    const img = new Image()
    img.onload = () => {
      const tpl = componentList.find((c) => c.component === 'Picture')
      if (!tpl) {
        ElMessage.error('未找到 Picture 组件模板')
        return
      }

      const component = deepCopy(tpl) as Component
      component.id = generateID()
      const oldProp = (component.propValue && typeof component.propValue === 'object'
        ? (component.propValue as Record<string, unknown>)
        : {}) as Record<string, unknown>
      const prevFlip = (oldProp.flip && typeof oldProp.flip === 'object' ? (oldProp.flip as Record<string, unknown>) : null) as
        | Record<string, unknown>
        | null
      component.propValue = {
        ...oldProp,
        url: fileResult,
        flip: {
          horizontal: (prevFlip?.horizontal as boolean | undefined) ?? false,
          vertical: (prevFlip?.vertical as boolean | undefined) ?? false,
        },
      }
      component.style.top = 0
      component.style.left = 0
      component.style.width = img.width
      component.style.height = img.height

      historyStore.executeAdd(component, undefined, 'insert image component')
      ElMessage.success('图片已插入')
      // 允许重复选择同一文件也能触发
      imageUploadRef.value?.clearFiles()
    }
    img.src = fileResult
  }
  reader.readAsDataURL(file)
}

function clearCanvas() {
  ElMessageBox.confirm('确定要清空画布吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    historyStore.executeClearCanvas('clear canvas')
  })
}
</script>

<style lang="scss" scoped>
.toolbar {
  height: 64px;
  line-height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;

  .upload {
    display: inline-flex;
  }

  .canvas-config {
    display: flex;
    align-items: center;
    margin-left: 10px;

    span {
      margin: 0 10px;
      font-size: 14px;
      color: #606266;
    }

    input {
      width: 60px;
      height: 28px;
      outline: none;
      padding: 0 5px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      text-align: center;

      &:focus {
        border-color: #409eff;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
