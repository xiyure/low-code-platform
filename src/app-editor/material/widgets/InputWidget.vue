<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  maxlength?: number;
  prefix?: string;
  suffix?: string;
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
  <div class="mat-input">
    <label v-if="props.label" class="field-label">
      {{ props.label }}<span v-if="props.required" class="required-mark">*</span>
    </label>
    <el-input
      v-model="value"
      :placeholder="props.placeholder ?? '请输入'"
      :disabled="props.disabled"
      :clearable="props.clearable"
      :maxlength="props.maxlength && props.maxlength > 0 ? props.maxlength : undefined"
      :show-word-limit="!!(props.maxlength && props.maxlength > 0)"
    >
      <template v-if="props.prefix" #prepend>{{ props.prefix }}</template>
      <template v-if="props.suffix" #append>{{ props.suffix }}</template>
    </el-input>
  </div>
</template>

<style scoped lang="scss">
.mat-input {
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
