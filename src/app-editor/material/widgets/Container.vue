<script setup lang="ts">
const props = defineProps<{
  direction?: 'vertical' | 'horizontal';
  justify?: string;
  align?: string;
  gap?: number;
  padding?: number;
  background?: string;
}>();
</script>

<template>
  <div
    class="mat-container"
    :style="{
      flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
      justifyContent: props.justify ?? 'flex-start',
      alignItems: props.align ?? 'flex-start',
      gap: (props.gap ?? 12) + 'px',
      padding: (props.padding ?? 16) + 'px',
      background: props.background ?? '#fff',
    }"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mat-container {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 80px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}
</style>
