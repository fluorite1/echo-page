<template>
  <div style="overflow: hidden">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Component } from '@/types'

interface Props {
  propValue: {
    url: string
    flip: {
      horizontal: boolean
      vertical: boolean
    }
  }
  element: Component
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement>()
const img = ref<HTMLImageElement>()
const isFirst = ref(true)

watch(
  () => props.element.style.width,
  () => drawImage()
)

watch(
  () => props.element.style.height,
  () => drawImage()
)

watch(
  () => props.propValue.flip.vertical,
  () => mirrorFlip()
)

watch(
  () => props.propValue.flip.horizontal,
  () => mirrorFlip()
)

function drawImage() {
  if (!canvasRef.value) return

  const { width, height } = props.element.style
  canvasRef.value.width = width
  canvasRef.value.height = height

  if (isFirst.value) {
    isFirst.value = false
    img.value = document.createElement('img')
    img.value.src = props.propValue.url
    img.value.onload = () => {
      const ctx = canvasRef.value?.getContext('2d')
      if (ctx && img.value) {
        ctx.drawImage(img.value, 0, 0, width, height)
        mirrorFlip()
      }
    }
  } else {
    mirrorFlip()
  }
}

function mirrorFlip() {
  if (!canvasRef.value || !img.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const { vertical, horizontal } = props.propValue.flip
  const { width, height } = props.element.style
  const hvalue = horizontal ? -1 : 1
  const vValue = vertical ? -1 : 1

  ctx.clearRect(0, 0, width, height)
  ctx.translate(width / 2 - (width * hvalue) / 2, height / 2 - (height * vValue) / 2)
  ctx.scale(hvalue, vValue)
  ctx.drawImage(img.value, 0, 0, width, height)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

onMounted(() => {
  drawImage()
})
</script>
