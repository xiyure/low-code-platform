<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  placeholder?: string;
  required?: boolean;
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
  <div class="mat-number">
    <label v-if="label" class="field-label">
      {{ label }}<span v-if="required" class="required-mark">*</span>
    </label>
    <el-input-number
      v-model="value"
      controls-position="right"
      :min="min"
      :max="max"
      :step="step ?? 1"
      :placeholder="placeholder"
      :disabled="disabled"
      class="number-input"
    />
  </div>
</template>

<style scoped lang="scss">
.mat-number {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.field-label {
  font-size: 13px;
  color: var(--color-text-2);
}

.required-mark {
  margin-left: 2px;
  color: var(--color-danger);
}

.number-input {
  width: 100%;
}
</style>
