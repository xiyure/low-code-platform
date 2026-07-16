<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  columns?: number;
  gap?: number;
  background?: string;
}>();

const cols = computed(() => Math.max(1, props.columns ?? 2));
const gapVal = computed(() => props.gap ?? 12);
</script>

<template>
  <div
    class="mat-columns"
    :style="{
      gap: gapVal + 'px',
      background: props.background ?? 'transparent',
    }"
  >
    <div v-for="i in cols" :key="i" class="mat-col col-placeholder">
      <span class="col-label">列 {{ i }}</span>
    </div>
    <!-- 自定义内容区：全宽，可拖入子组件 -->
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mat-columns {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);

  .mat-col {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    min-height: 56px;
    background: var(--color-bg-2);
    border-radius: var(--radius-sm);
  }

  .col-placeholder {
    font-size: 12px;
    color: var(--color-text-4);
  }
}
</style>
