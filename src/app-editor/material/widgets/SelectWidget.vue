<script setup lang="ts">
import { ref } from 'vue';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  options?: Option[];
  defaultValue?: string | string[];
}>();

const value = ref<string | string[]>(
  props.defaultValue ?? (props.multiple ? [] : ''),
);
const options = props.options ?? [];

defineExpose({
  getValue: () => value.value,
  setValue: (v: string | string[]) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="mat-select">
    <label v-if="label" class="field-label">
      {{ label }}<span v-if="required" class="required-mark">*</span>
    </label>
    <el-select
      v-model="value"
      :multiple="multiple"
      :collapse-tags="multiple"
      :clearable="clearable"
      :placeholder="placeholder ?? '请选择'"
      :disabled="disabled"
      class="select-input"
    >
      <el-option
        v-for="opt in options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>
  </div>
</template>

<style scoped lang="scss">
.mat-select {
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

.select-input {
  width: 100%;
}
</style>
