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
    <div
      v-for="i in cols"
      :key="i"
      class="mat-col"
    >
      <span v-if="!$slots.default" class="col-label">列 {{ i }}</span>
    </div>
    <div v-if="$slots.default" class="mat-col col-slot"><slot /></div>
    <div v-if="!$slots.default" class="col-placeholder">将组件拖入分栏</div>
  </div>
</template>

<style scoped>
.mat-columns {
  display: flex;
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.mat-col {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  background: var(--color-bg-2);
  border-radius: var(--radius-sm);
}

.col-label {
  font-size: 12px;
  color: var(--color-text-4);
}

.col-slot {
  flex: 1;
  min-width: 0;
}

.col-placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-4);
}
</style>
