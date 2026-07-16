<script setup lang="ts">
defineProps<{ padding?: number; gap?: number; background?: string }>();
</script>

<template>
  <div
    class="mat-container"
    :style="{
      padding: (padding ?? 16) + 'px',
      gap: (gap ?? 12) + 'px',
      background: background ?? '#fff',
    }"
  >
    <slot />
    <div v-if="!$slots.default" class="container-placeholder">将组件拖入容器</div>
  </div>
</template>

<style scoped>
.mat-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.container-placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-4);
}
</style>
