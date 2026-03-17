<template>
  <div class="component-list">
    <div
      v-for="(item, index) in componentList"
      :key="index"
      class="list"
      draggable="true"
      :data-index="index"
      @dragstart="handleDragStart"
    >
      <span class="label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import componentList from '@/custom-component/component-list'

function handleDragStart(e: DragEvent) {
  const target = e.currentTarget as HTMLElement
  const index = target.dataset.index
  if (index && e.dataTransfer) {
    e.dataTransfer.setData('text/plain', index)
    e.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<style lang="scss" scoped>
.component-list {
  opacity: 1;
  height: 65%;
  padding: 8px;
  display: grid;
  position: relative;
  grid-gap: 10px 19px;
  grid-template-columns: repeat(auto-fill, 80px);
  grid-template-rows: repeat(auto-fill, 40px);
  transition: opacity 0.5s 0.5s;
  overflow-y: auto;

  .list {
    width: 80px;
    height: 40px;
    border: 1px solid #ddd;
    cursor: grab;
    text-align: center;
    padding: 2px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 4px;
    user-select: none;
    -webkit-user-drag: element;

    &:hover {
      border-color: #409eff;
      background: #ecf5ff;
    }

    &:active {
      cursor: grabbing;
    }

    .label {
      font-size: 12px;
      color: #606266;
      pointer-events: none;
    }
  }
}
</style>
