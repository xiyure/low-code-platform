<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  title?: string;
  width?: string;
  content?: string;
}>();

const visible = ref(false);

function open(): void {
  visible.value = true;
}
function close(): void {
  visible.value = false;
}

defineExpose({ open, close, getVisible: () => visible.value });
</script>

<template>
  <div class="mat-modal">
    <el-button type="primary" @click="open">
      {{ title ? `打开${title}` : '打开弹窗' }}
    </el-button>
    <el-dialog
      v-model="visible"
      :title="title ?? '弹窗标题'"
      :width="width ?? '500px'"
    >
      <div class="modal-content">{{ content ?? '弹窗内容区域' }}</div>
      <template #footer>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="close">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.mat-modal {
  display: inline-flex;
  width: 100%;
}

.modal-content {
  min-height: 60px;
  padding: 12px 0;
  font-size: 14px;
  color: var(--color-text-2);
}
</style>
