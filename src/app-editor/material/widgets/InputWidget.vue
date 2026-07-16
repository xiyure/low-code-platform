<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ label?: string; placeholder?: string; required?: boolean }>();
const value = ref('');

defineExpose({
  getValue: () => value.value,
  setValue: (v: string) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="mat-input">
    <label v-if="label" class="input-label">
      {{ label }}<span v-if="required" class="required">*</span>
    </label>
    <el-input v-model="value" :placeholder="placeholder ?? '请输入'" />
  </div>
</template>

<style scoped>
.mat-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.input-label {
  font-size: 13px;
  color: var(--color-text-2);
}

.required {
  margin-left: 2px;
  color: var(--color-danger);
}
</style>
