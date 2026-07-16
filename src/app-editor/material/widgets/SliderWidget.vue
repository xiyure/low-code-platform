<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
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
    <label v-if="label" class="field-label">{{ label }}</label>
    <el-slider
      v-model="value"
      :min="min ?? 0"
      :max="max ?? 100"
      :step="step ?? 1"
      :disabled="disabled"
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
