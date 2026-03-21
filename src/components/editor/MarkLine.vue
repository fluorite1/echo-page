<template>
  <div class="mark-line">
    <div
      v-for="line in lines"
      v-show="lineStatus[line as keyof typeof lineStatus] || false"
      :key="line"
      :ref="(el) => setLineRef(line, el)"
      class="line"
      :class="line.includes('x') ? 'xline' : 'yline'"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { eventBus } from '@/utils/eventBus'
import { getComponentRect } from '@/utils/style'

const editorStore = useEditorStore()
const { curComponent, componentData } = storeToRefs(editorStore)

const lines = ['xt', 'xc', 'xb', 'yl', 'yc', 'yr']
const diff = 3

const lineStatus = reactive({
  xt: false,
  xc: false,
  xb: false,
  yl: false,
  yc: false,
  yr: false,
})

const lineRefs = ref<Record<string, HTMLElement>>({})

function setLineRef(line: string, el: any) {
  if (el) {
    lineRefs.value[line] = el
  }
}

function hideLine() {
  Object.keys(lineStatus).forEach((line) => {
    lineStatus[line as keyof typeof lineStatus] = false
  })
}

function isNearly(dragValue: number, targetValue: number): boolean {
  return Math.abs(dragValue - targetValue) <= diff
}

function showLine(isDownward: boolean, isRightward: boolean) {
  if (!curComponent.value) return

  const components = componentData.value
  const curComponentStyle = getComponentRect(curComponent.value.style)
  const curComponentHalfwidth = curComponentStyle.width / 2
  const curComponentHalfHeight = curComponentStyle.height / 2

  hideLine()

  components.forEach((component) => {
    if (component === curComponent.value) return

    const componentStyle = getComponentRect(component.style)
    const { top, left, bottom, right } = componentStyle
    const componentHalfwidth = componentStyle.width / 2
    const componentHalfHeight = componentStyle.height / 2

    const conditions = {
      top: [
        {
          isNearly: isNearly(curComponentStyle.top, top),
          lineNode: lineRefs.value.xt,
          line: 'xt',
          dragShift: top,
          lineShift: top,
        },
        {
          isNearly: isNearly(curComponentStyle.bottom, top),
          lineNode: lineRefs.value.xt,
          line: 'xt',
          dragShift: top - curComponentStyle.height,
          lineShift: top,
        },
        {
          isNearly: isNearly(curComponentStyle.top + curComponentHalfHeight, top + componentHalfHeight),
          lineNode: lineRefs.value.xc,
          line: 'xc',
          dragShift: top + componentHalfHeight - curComponentHalfHeight,
          lineShift: top + componentHalfHeight,
        },
        {
          isNearly: isNearly(curComponentStyle.top, bottom),
          lineNode: lineRefs.value.xb,
          line: 'xb',
          dragShift: bottom,
          lineShift: bottom,
        },
        {
          isNearly: isNearly(curComponentStyle.bottom, bottom),
          lineNode: lineRefs.value.xb,
          line: 'xb',
          dragShift: bottom - curComponentStyle.height,
          lineShift: bottom,
        },
      ],
      left: [
        {
          isNearly: isNearly(curComponentStyle.left, left),
          lineNode: lineRefs.value.yl,
          line: 'yl',
          dragShift: left,
          lineShift: left,
        },
        {
          isNearly: isNearly(curComponentStyle.right, left),
          lineNode: lineRefs.value.yl,
          line: 'yl',
          dragShift: left - curComponentStyle.width,
          lineShift: left,
        },
        {
          isNearly: isNearly(curComponentStyle.left + curComponentHalfwidth, left + componentHalfwidth),
          lineNode: lineRefs.value.yc,
          line: 'yc',
          dragShift: left + componentHalfwidth - curComponentHalfwidth,
          lineShift: left + componentHalfwidth,
        },
        {
          isNearly: isNearly(curComponentStyle.left, right),
          lineNode: lineRefs.value.yr,
          line: 'yr',
          dragShift: right,
          lineShift: right,
        },
        {
          isNearly: isNearly(curComponentStyle.right, right),
          lineNode: lineRefs.value.yr,
          line: 'yr',
          dragShift: right - curComponentStyle.width,
          lineShift: right,
        },
      ],
    }

    const needToShow: string[] = []
    ;(Object.keys(conditions) as Array<keyof typeof conditions>).forEach((key) => {
      conditions[key].forEach((condition) => {
        if (!condition.isNearly) return

        editorStore.setShapeStyle({ [key]: condition.dragShift })

        if (condition.lineNode) {
          condition.lineNode.style[key as any] = `${condition.lineShift}px`
        }
        needToShow.push(condition.line)
      })
    })

    if (needToShow.length) {
      chooseTheTrueLine(needToShow, isDownward, isRightward)
    }
  })
}

function chooseTheTrueLine(needToShow: string[], isDownward: boolean, isRightward: boolean) {
  if (isRightward) {
    if (needToShow.includes('yr')) {
      lineStatus.yr = true
    } else if (needToShow.includes('yc')) {
      lineStatus.yc = true
    } else if (needToShow.includes('yl')) {
      lineStatus.yl = true
    }
  } else {
    if (needToShow.includes('yl')) {
      lineStatus.yl = true
    } else if (needToShow.includes('yc')) {
      lineStatus.yc = true
    } else if (needToShow.includes('yr')) {
      lineStatus.yr = true
    }
  }

  if (isDownward) {
    if (needToShow.includes('xb')) {
      lineStatus.xb = true
    } else if (needToShow.includes('xc')) {
      lineStatus.xc = true
    } else if (needToShow.includes('xt')) {
      lineStatus.xt = true
    }
  } else {
    if (needToShow.includes('xt')) {
      lineStatus.xt = true
    } else if (needToShow.includes('xc')) {
      lineStatus.xc = true
    } else if (needToShow.includes('xb')) {
      lineStatus.xb = true
    }
  }
}

onMounted(() => {
  eventBus.on('move', ([isDownward, isRightward]) => showLine(isDownward, isRightward))
  eventBus.on('unmove', () => hideLine())
})

onBeforeUnmount(() => {
  eventBus.off('move')
  eventBus.off('unmove')
})
</script>

<style lang="scss" scoped>
.mark-line {
  height: 100%;
  pointer-events: none;
}

.line {
  background: #59c7f9;
  position: absolute;
  z-index: 1000;
}

.xline {
  width: 100%;
  height: 1px;
}

.yline {
  width: 1px;
  height: 100%;
}
</style>
