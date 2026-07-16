<script setup lang="ts">
defineProps<{
  percentage?: number;
  status?: '' | 'success' | 'warning' | 'exception';
  strokeWidth?: number;
  showText?: boolean;
  color?: string;
}>();
</script>

<template>
  <div class="mat-progress">
    <el-progress
      :percentage="percentage ?? 50"
      :status="status || undefined"
      :stroke-width="strokeWidth ?? 6"
      :show-text="showText ?? true"
      :color="color"
    />
  </div>
</template>

<style scoped>
.mat-progress {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}
</style>
