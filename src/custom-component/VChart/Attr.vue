<template>
  <div class="attr">
    <CommonAttr :component="props.component" :component-data="props.componentData" @change="emit('change', $event)" />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="标题">
        <el-switch
          :model-value="Boolean(optionDraft.title?.show)"
          active-text="显示标题"
          @change="(value) => updateOption((next) => { next.title.show = Boolean(value) }, 'chart option title show')"
        />
        <el-input
          v-model="optionDraft.title.text"
          placeholder="请输入内容"
          @change="commitOption('chart option title text')"
        />
      </el-form-item>

      <el-form-item label="工具提示">
        <el-switch
          :model-value="Boolean(optionDraft.tooltip?.show)"
          active-text="显示提示"
          @change="(value) => updateOption((next) => { next.tooltip.show = Boolean(value) }, 'chart option tooltip show')"
        />
      </el-form-item>

      <el-form-item label="图例">
        <el-switch
          :model-value="Boolean(optionDraft.legend?.show)"
          active-text="显示图例"
          @change="(value) => updateOption((next) => { next.legend.show = Boolean(value) }, 'chart option legend show')"
        />
      </el-form-item>

      <el-form-item label="横坐标">
        <el-switch
          :model-value="Boolean(optionDraft.xAxis?.show)"
          active-text="显示横坐标"
          @change="(value) => updateOption((next) => { next.xAxis.show = Boolean(value) }, 'chart option xAxis show')"
        />
      </el-form-item>

      <el-form-item label="图表类型">
        <el-select
          :model-value="optionDraft.series?.type"
          placeholder="选择图表类型"
          @change="(value) => updateOption((next) => { next.series.type = value }, 'chart option series type')"
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
        <el-button @click="openDataDialog">修改数据</el-button>
      </el-form-item>

      <el-divider content-position="left">数据来源（预览生效）</el-divider>
      <el-form-item label="请求地址">
        <el-input
          v-model="requestDraft.url"
          placeholder="例如：https://example.com/api/data"
          @change="commitRequest('chart request url')"
        />
      </el-form-item>

      <el-form-item label="请求方法">
        <el-select
          :model-value="requestDraft.method"
          @change="(value) => updateRequest((next) => { next.method = value as RequestConfig['method'] }, 'chart request method')"
        >
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
        </el-select>
      </el-form-item>

      <el-form-item label="参数类型">
        <el-select :model-value="requestDraft.paramType" @change="onRequestParamTypeChange">
          <el-option label="object" value="object" />
          <el-option label="array" value="array" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="requestDraft.paramType === 'object'" label="请求参数">
        <div class="kv-list">
          <div v-for="(kv, i) in requestDraft.data" :key="i" class="kv-row">
            <el-input
              v-model="requestDraft.data[i][0]"
              placeholder="key"
              @change="commitRequest('chart request kv key')"
            />
            <el-input
              v-model="requestDraft.data[i][1]"
              placeholder="value"
              @change="commitRequest('chart request kv value')"
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
        <el-switch
          :model-value="requestDraft.series"
          @change="(value) => updateRequest((next) => { next.series = Boolean(value) }, 'chart request series')"
        />
      </el-form-item>

      <template v-if="requestDraft.series">
        <el-form-item label="间隔(ms)">
          <el-input-number
            :model-value="requestDraft.time"
            :min="200"
            :step="100"
            @change="(value) => updateRequest((next) => { next.time = value ?? 200 }, 'chart request time')"
          />
        </el-form-item>
        <el-form-item label="次数(0无限)">
          <el-input-number
            :model-value="requestDraft.requestCount"
            :min="0"
            :step="1"
            @change="(value) => updateRequest((next) => { next.requestCount = value ?? 0 }, 'chart request count')"
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
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import { ElMessage } from 'element-plus'
import type { Component, ComponentAttrChange, RequestConfig } from '@/types'
import { deepCopy, isJSONEqual } from '@/utils/common'

const props = defineProps<{
  component: Component
  componentData: Component[]
}>()

const emit = defineEmits<{
  change: [payload: ComponentAttrChange]
}>()

const dialogVisible = ref(false)
const dataText = ref('')
const xAxisText = ref('')

const charts = [
  { label: '柱状图', value: 'bar' },
  { label: '散点图', value: 'scatter' },
  { label: '折线图', value: 'line' },
]

const arrayText = ref('[]')
const optionDraft = ref<any>(createDefaultOption())
const requestDraft = ref<RequestConfig>(createDefaultRequest())

watch(
  () => props.component,
  () => {
    optionDraft.value = createNextPropValue().option
    requestDraft.value = createNextRequest()
  },
  { immediate: true, deep: true },
)

watch(
  () => props.component.request,
  () => {
    if (requestDraft.value.paramType === 'array') {
      arrayText.value = JSON.stringify(requestDraft.value.data ?? [], null, 0)
    } else {
      arrayText.value = '[]'
    }
  },
  { immediate: true },
)

function isKVArray(data: unknown): data is Array<[string, string]> {
  return (
    Array.isArray(data) &&
    data.every((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string')
  )
}

function addKV() {
  if (!isKVArray(requestDraft.value.data)) {
    requestDraft.value.data = [['', '']]
  }
  requestDraft.value.data.push(['', ''])
  commitRequest('chart request add kv')
}

function removeKV(i: number) {
  if (!isKVArray(requestDraft.value.data)) {
    requestDraft.value.data = [['', '']]
    return
  }
  requestDraft.value.data.splice(i, 1)
  commitRequest('chart request remove kv')
}

function applyArray() {
  try {
    const arr = JSON.parse(arrayText.value)
    if (!Array.isArray(arr)) throw new Error('not array')
    requestDraft.value.data = arr
    commitRequest('chart request apply array')
    ElMessage.success('已应用')
  } catch {
    ElMessage.error('数组格式错误')
  }
}

function updateData() {
  try {
    const data = JSON.parse(dataText.value)
    const xAxis = JSON.parse(xAxisText.value)

    updateOption((next) => {
      next.series.data = data
      next.xAxis.data = xAxis
    }, 'chart static data update')
    ElMessage.success('更新成功')
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('数据格式错误，请检查JSON格式')
  }
}

function createDefaultRequest(): RequestConfig {
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

function createDefaultOption() {
  return {
    title: { show: true, text: '' },
    tooltip: { show: true },
    legend: { show: true },
    xAxis: { show: true, data: [] },
    yAxis: {},
    series: { type: 'bar', data: [] },
  }
}

function createNextPropValue() {
  const next = deepCopy(props.component.propValue ?? {})
  next.option ||= createDefaultOption()
  next.option.title ||= { show: true, text: '' }
  next.option.tooltip ||= { show: true }
  next.option.legend ||= { show: true }
  next.option.xAxis ||= { show: true, data: [] }
  next.option.series ||= { type: 'bar', data: [] }
  return next
}

function createNextRequest() {
  return deepCopy(props.component.request ?? createDefaultRequest())
}

function updateOption(mutator: (nextOption: any) => void, label: string) {
  const current = createNextPropValue()
  const next = deepCopy(current)
  next.option = deepCopy(optionDraft.value)
  mutator(next.option)
  optionDraft.value = deepCopy(next.option)

  if (isJSONEqual(next, current)) return

  emit('change', {
    patch: { propValue: next },
    label,
  })
}

function updateRequest(mutator: (nextRequest: RequestConfig) => void, label: string) {
  const current = createNextRequest()
  const next = deepCopy(current)
  next.data = deepCopy(requestDraft.value.data)
  next.method = requestDraft.value.method
  next.url = requestDraft.value.url
  next.series = requestDraft.value.series
  next.time = requestDraft.value.time
  next.paramType = requestDraft.value.paramType
  next.requestCount = requestDraft.value.requestCount
  mutator(next)
  requestDraft.value = deepCopy(next)

  if (isJSONEqual(next, current)) return

  emit('change', {
    patch: { request: next },
    label,
  })
}

function onRequestParamTypeChange(value: string) {
  requestDraft.value.paramType = value
  if (value === 'object') {
    if (!isKVArray(requestDraft.value.data)) requestDraft.value.data = [['', '']]
  } else {
    if (isKVArray(requestDraft.value.data)) requestDraft.value.data = []
    arrayText.value = JSON.stringify(requestDraft.value.data ?? [], null, 0)
  }
  commitRequest('chart request paramType')
}

function commitOption(label: string) {
  updateOption((next) => {
    next.title = deepCopy(optionDraft.value.title)
    next.tooltip = deepCopy(optionDraft.value.tooltip)
    next.legend = deepCopy(optionDraft.value.legend)
    next.xAxis = deepCopy(optionDraft.value.xAxis)
    next.yAxis = deepCopy(optionDraft.value.yAxis)
    next.series = deepCopy(optionDraft.value.series)
  }, label)
}

function commitRequest(label: string) {
  updateRequest((next) => {
    next.method = requestDraft.value.method
    next.data = deepCopy(requestDraft.value.data)
    next.url = requestDraft.value.url
    next.series = requestDraft.value.series
    next.time = requestDraft.value.time
    next.paramType = requestDraft.value.paramType
    next.requestCount = requestDraft.value.requestCount
  }, label)
}

function updateRequestKV(index: number, pos: 0 | 1, value: string, label: string) {
  if (!isKVArray(requestDraft.value.data)) requestDraft.value.data = [['', '']]
  requestDraft.value.data[index] ||= ['', '']
  requestDraft.value.data[index][pos] = value
  commitRequest(label)
}

function openDataDialog() {
  dataText.value = JSON.stringify(optionDraft.value.series?.data ?? [], null, 2)
  xAxisText.value = JSON.stringify(optionDraft.value.xAxis?.data ?? [], null, 2)
  dialogVisible.value = true
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
