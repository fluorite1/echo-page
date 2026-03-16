<template>
  <div class="attr-list">
    <CommonAttr />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="按钮文字">
        <el-input v-model="curComponent!.propValue" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'

const editorStore = useEditorStore()
const { curComponent } = storeToRefs(editorStore)
</script>
