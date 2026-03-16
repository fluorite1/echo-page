<template>
  <div class="attr-list v-table-attr">
    <CommonAttr />
    <EditTable />
    <el-form label-width="80px" size="small" style="padding: 10px">
      <el-form-item label="斑马纹">
        <el-switch v-model="curComponent!.propValue.stripe" />
      </el-form-item>
      <el-form-item label="表头加粗">
        <el-switch v-model="curComponent!.propValue.thBold" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import EditTable from './EditTable.vue'

const editorStore = useEditorStore()
const { curComponent } = storeToRefs(editorStore)
</script>
