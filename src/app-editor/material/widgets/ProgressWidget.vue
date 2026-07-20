<script setup lang="ts">
defineProps<{
  percentage?: number;
  status?: '' | 'success' | 'warning' | 'exception';
  strokeWidth?: number;
  showText?: boolean;
  color?: string;
}>();

/** 自定义文字格式：始终显示百分比，避免设置 status 后文字被状态图标替换 */
function formatPercent(percentage: number): string {
  return `${percentage}%`;
}
</script>

<template>
  <div class="mat-progress">
    <el-progress
      :percentage="percentage ?? 50"
      :status="status || undefined"
      :stroke-width="strokeWidth ?? 6"
      :show-text="showText ?? true"
      :color="color || undefined"
      :format="formatPercent"
    />
  </div>
</template>

<style scoped lang="scss">
.mat-progress {
  width: 100%;
  padding: 8px 0;

  /* 确保 el-progress 撑满容器宽度，避免进度条线条塌缩 */
  :deep(.el-progress) {
    width: 100%;
  }
}
</style>
