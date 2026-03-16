<template>
  <div class="attr-list">
    <CommonAttr />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="图片URL">
        <el-input v-model="curComponent!.propValue.url" placeholder="请输入图片URL" />
      </el-form-item>
      <el-form-item label="镜像翻转">
        <div>
          <el-checkbox v-model="curComponent!.propValue.flip.horizontal">水平翻转</el-checkbox>
          <el-checkbox v-model="curComponent!.propValue.flip.vertical">垂直翻转</el-checkbox>
        </div>
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
