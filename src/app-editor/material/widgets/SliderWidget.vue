<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  activeColor?: string;
  inactiveColor?: string;
  labelColor?: string;
}>();

const value = ref(props.defaultValue ?? 0);

defineExpose({
  getValue: () => value.value,
  setValue: (v: number) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="mat-slider">
    <label
      v-if="label"
      class="field-label"
      :style="{ color: labelColor || undefined }"
    >
      {{ label }}
    </label>
    <!-- Element Plus 新版 el-slider 废弃了 active-color/inactive-color prop，改用 CSS 变量 -->
    <el-slider
      v-model="value"
      :min="min ?? 0"
      :max="max ?? 100"
      :step="step ?? 1"
      :disabled="disabled"
      :style="{
        '--el-slider-main-bg-color': activeColor || undefined,
        '--el-slider-runway-bg-color': inactiveColor || undefined,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.mat-slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.field-label {
  font-size: 13px;
  color: var(--color-text-2);
}
</style>
