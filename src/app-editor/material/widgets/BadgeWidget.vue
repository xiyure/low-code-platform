<script setup lang="ts">
defineProps<{
  value?: string | number;
  max?: number;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  hidden?: boolean;
  content?: string;
}>();
</script>

<template>
  <div class="mat-badge">
    <el-badge
      :value="value ?? 'New'"
      :max="max ?? 99"
      :type="(type as any) ?? 'danger'"
      :hidden="hidden"
    >
      <span class="badge-content">{{ content ?? '徽标内容' }}</span>
    </el-badge>
  </div>
</template>

<style scoped>
.mat-badge {
  display: inline-flex;
  align-items: center;
}

.badge-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 32px;
  font-size: 13px;
  color: var(--color-text-2);
  background: var(--color-bg-2);
  border-radius: var(--radius-sm);
}
</style>
