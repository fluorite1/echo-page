<template>
  <div class="attr">
    <CommonAttr />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="标题">
        <el-switch
          v-model="option.title.show"
          active-text="显示标题"
          @change="record('chart option title show')"
        />
        <el-input
          v-model="option.title.text"
          placeholder="请输入内容"
          @change="record('chart option title text')"
        />
      </el-form-item>

      <el-form-item label="工具提示">
        <el-switch
          v-model="option.tooltip.show"
          active-text="显示提示"
          @change="record('chart option tooltip show')"
        />
      </el-form-item>

      <el-form-item label="图例">
        <el-switch
          v-model="option.legend.show"
          active-text="显示图例"
          @change="record('chart option legend show')"
        />
      </el-form-item>

      <el-form-item label="横坐标">
        <el-switch
          v-model="option.xAxis.show"
          active-text="显示横坐标"
          @change="record('chart option xAxis show')"
        />
      </el-form-item>

      <el-form-item label="图表类型">
        <el-select
          v-model="option.series.type"
          placeholder="选择图表类型"
          @change="record('chart option series type')"
        >
          <el-option
            v-for="chart in charts"
            :key="chart.value"
            :label="chart.label"
            :value="chart.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="静态数据">
        <el-button @click="dialogVisible = true">修改数据</el-button>
      </el-form-item>

      <el-divider content-position="left">数据来源（预览生效）</el-divider>
      <el-form-item label="请求地址">
        <el-input
          v-model.trim="request.url"
          placeholder="例如：https://example.com/api/data"
          @change="record('chart request url')"
        />
      </el-form-item>

      <el-form-item label="请求方法">
        <el-select v-model="request.method" @change="record('chart request method')">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
        </el-select>
      </el-form-item>

      <el-form-item label="参数类型">
        <el-select v-model="request.paramType">
          <el-option label="object" value="object" />
          <el-option label="array" value="array" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="request.paramType === 'object'" label="请求参数">
        <div class="kv-list">
          <div v-for="(kv, i) in request.data" :key="i" class="kv-row">
            <el-input v-model="kv[0]" placeholder="key" @change="record('chart request kv key')" />
            <el-input
              v-model="kv[1]"
              placeholder="value"
              @change="record('chart request kv value')"
            />
            <el-button text type="danger" @click="removeKV(i)">删除</el-button>
          </div>
          <el-button @click="addKV">添加参数</el-button>
        </div>
      </el-form-item>

      <el-form-item v-else label="请求参数">
        <el-input
          v-model="arrayText"
          type="textarea"
          :rows="3"
          placeholder="JSON数组，例如：[1,2,3]"
        />
        <el-button style="margin-top: 8px" @click="applyArray">应用</el-button>
      </el-form-item>

      <el-form-item label="定时刷新">
        <el-switch v-model="request.series" @change="record('chart request series')" />
      </el-form-item>

      <template v-if="request.series">
        <el-form-item label="间隔(ms)">
          <el-input-number
            v-model="request.time"
            :min="200"
            :step="100"
            @change="record('chart request time')"
          />
        </el-form-item>
        <el-form-item label="次数(0无限)">
          <el-input-number
            v-model="request.requestCount"
            :min="0"
            :step="1"
            @change="record('chart request count')"
          />
        </el-form-item>
      </template>
    </el-form>

    <el-dialog v-model="dialogVisible" title="数据修改" width="75%">
      <el-input
        v-model="dataText"
        type="textarea"
        :rows="15"
        placeholder="请输入数据，格式：[23, 61, 35, 77, 35]"
      />
      <el-input
        v-model="xAxisText"
        type="textarea"
        :rows="5"
        placeholder="请输入横坐标数据，格式：['A', 'B', 'C', 'D', 'E']"
        style="margin-top: 10px"
      />
      <template #footer>
        <el-button type="primary" @click="updateData">更新数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import { ElMessage } from 'element-plus'
import type { RequestConfig, Component } from '@/types'
import { deepCopy } from '@/utils/common'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const { curComponent } = storeToRefs(editorStore)

const dialogVisible = ref(false)
const dataText = ref('')
const xAxisText = ref('')

const charts = [
  { label: '柱状图', value: 'bar' },
  { label: '散点图', value: 'scatter' },
  { label: '折线图', value: 'line' },
]

const option = computed(() => {
  if (curComponent.value && curComponent.value.propValue) {
    return (curComponent.value.propValue as any).option
  }
  return {}
})

const request = computed<RequestConfig>(() => {
  if (!curComponent.value) {
    // 未选中组件时返回默认配置，避免模板报错
    return {
      method: 'GET',
      data: [['', '']],
      url: '',
      series: false,
      time: 1000,
      paramType: 'object',
      requestCount: 0,
    }
  }
  if (!curComponent.value.request) {
    curComponent.value.request = {
      method: 'GET',
      data: [['', '']],
      url: '',
      series: false,
      time: 1000,
      paramType: 'object',
      requestCount: 0,
    }
  }
  return curComponent.value.request
})

const arrayText = ref('[]')

const lastSnapshot = ref<Component | null>(null)
function snapshotComponent(): Component | null {
  const c = curComponent.value
  if (!c) return null
  // 让 request 默认值在 snapshot 前就落到组件上，避免首次记录把“初始化 request”也算进用户改动
  void request.value
  return deepCopy(c)
}

watch(
  curComponent,
  () => {
    lastSnapshot.value = snapshotComponent()
  },
  { immediate: true },
)

function record(label: string) {
  const c = curComponent.value
  if (!c) return
  const before = lastSnapshot.value ?? snapshotComponent()
  const after = snapshotComponent()
  if (!before || !after) return
  historyStore.executeUpdate(c.id, before, after, label)
  lastSnapshot.value = after
}

function isKVArray(data: unknown): data is Array<[string, string]> {
  return (
    Array.isArray(data) &&
    data.every((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string')
  )
}

function addKV() {
  if (!isKVArray(request.value.data)) {
    request.value.data = [['', '']]
  }
  request.value.data.push(['', ''])
  record('chart request add kv')
}

function removeKV(i: number) {
  if (!isKVArray(request.value.data)) {
    request.value.data = [['', '']]
    return
  }
  request.value.data.splice(i, 1)
  record('chart request remove kv')
}

function applyArray() {
  try {
    const arr = JSON.parse(arrayText.value)
    if (!Array.isArray(arr)) throw new Error('not array')
    // request.ts 里 paramType=array 时会原样发送 data
    request.value.data = arr
    ElMessage.success('已应用')
    record('chart request apply array')
  } catch {
    ElMessage.error('数组格式错误')
  }
}

let didInitParamType = false
watch(
  () => request.value.paramType,
  (t) => {
    if (t === 'object') {
      // 确保 data 是 kv 数组
      if (!isKVArray(request.value.data)) {
        request.value.data = [['', '']]
      }
    } else if (t === 'array') {
      // data 期望是 JSON array
      if (isKVArray(request.value.data)) {
        request.value.data = []
      }
      arrayText.value = JSON.stringify(request.value.data ?? [], null, 0)
    }
    if (didInitParamType) record('chart request paramType')
    didInitParamType = true
  },
  { immediate: true },
)

function updateData() {
  try {
    const data = JSON.parse(dataText.value)
    const xAxis = JSON.parse(xAxisText.value)

    if (option.value.series) {
      option.value.series.data = data
    }
    if (option.value.xAxis) {
      option.value.xAxis.data = xAxis
    }

    ElMessage.success('更新成功')
    dialogVisible.value = false
    record('chart static data update')
  } catch (e) {
    ElMessage.error('数据格式错误，请检查JSON格式')
  }
}
</script>

<style lang="scss" scoped>
.attr {
  padding: 10px;
}

.kv-list {
  width: 100%;
}

.kv-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
</style>
