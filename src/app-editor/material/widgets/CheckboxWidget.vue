<script setup lang="ts">
import { ref } from 'vue';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{
  label?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Option[];
  defaultValue?: string[];
}>();

const value = ref<string[]>(props.defaultValue ?? []);
const options = props.options ?? [];

defineExpose({
  getValue: () => value.value,
  setValue: (v: string[]) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="mat-checkbox">
    <label v-if="label" class="field-label">
      {{ label }}<span v-if="required" class="required-mark">*</span>
    </label>
    <el-checkbox-group v-model="value" :disabled="disabled">
      <el-checkbox v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<style scoped lang="scss">
.mat-checkbox {
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
</style>
