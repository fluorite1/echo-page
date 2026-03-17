<template>
  <VChart class="chart" :option="propValue.option" autoresize />
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { requestJSON } from '@/utils/request'
import type { Component } from '@/types'

use([
  CanvasRenderer,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  LineChart,
])

interface ChartPropValue {
  option: any
}

interface Props {
  propValue: ChartPropValue
  element: Component
}

const props = defineProps<Props>()

const editorStore = useEditorStore()
const { editMode } = storeToRefs(editorStore)

let timer: number | undefined
let requestCount = 0

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
  requestCount = 0
}

/** 将接口返回数据写入图表 option，约定：数组即 series.data；对象为 { data? | series?.[0].data, xAxis?.data | xAxisData } */
function applyResponse(option: any, data: any) {
  if (Array.isArray(data)) {
    if (option?.series) option.series.data = data
    return
  }
  if (!data || typeof data !== 'object') return
  const d = data as Record<string, unknown>
  const seriesData = (Array.isArray(d.series) && (d.series as any[])[0]?.data) ?? d.data
  if (Array.isArray(seriesData) && option?.series) option.series.data = seriesData
  const xAxisData = (d.xAxis as any)?.data ?? d.xAxisData
  if (Array.isArray(xAxisData) && option?.xAxis) option.xAxis.data = xAxisData
}

async function fetchAndApply() {
  const req = props.element.request
  if (!req?.url) return
  try {
    const data = await requestJSON(req)
    applyResponse(props.propValue.option, data)
  } catch {
    // 获取不到数据就保持静态数据（不弹错误，避免预览期刷屏）
  }
}

function startRequest() {
  clearTimer()
  const req = props.element.request
  if (!req?.url) return

  // 只在预览模式生效
  if (editMode.value !== 'preview') return

  if (!req.series) {
    void fetchAndApply()
    return
  }

  const interval = Math.max(200, Number(req.time) || 1000)
  timer = window.setInterval(() => {
    if (req.requestCount && req.requestCount !== 0 && requestCount >= req.requestCount) {
      clearTimer()
      return
    }
    requestCount++
    void fetchAndApply()
  }, interval)
}

watch(
  () => [editMode.value, props.element.request],
  () => startRequest(),
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
