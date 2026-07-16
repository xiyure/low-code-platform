<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxlength?: number;
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
  <div class="mat-textarea">
    <label v-if="label" class="field-label">
      {{ label }}<span v-if="required" class="required-mark">*</span>
    </label>
    <el-input
      v-model="value"
      type="textarea"
      :rows="rows ?? 3"
      :maxlength="maxlength"
      :placeholder="placeholder ?? '请输入'"
      :disabled="disabled"
    />
  </div>
</template>

<style scoped>
.mat-textarea {
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
