<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  format?: string;
  defaultValue?: string;
}>();

const value = ref(props.defaultValue ?? '');

defineExpose({
  getValue: () => value.value,
  setValue: (v: string) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="mat-datepicker">
    <label v-if="label" class="field-label">
      {{ label }}<span v-if="required" class="required-mark">*</span>
    </label>
    <el-date-picker
      v-model="value"
      :type="(type ?? 'date') as any"
      :format="format"
      :value-format="format"
      :placeholder="placeholder ?? '请选择日期'"
      :disabled="disabled"
      class="datepicker-input"
    />
  </div>
</template>

<style scoped lang="scss">
.mat-datepicker {
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

.datepicker-input {
  width: 100%;
}
</style>
