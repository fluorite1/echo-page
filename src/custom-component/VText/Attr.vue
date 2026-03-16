<template>
  <div class="attr-list">
    <CommonAttr />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="内容">
        <el-input v-model="curComponent!.propValue" type="textarea" :rows="3" />
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
