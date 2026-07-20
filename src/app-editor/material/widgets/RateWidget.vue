<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  disabled?: boolean;
  max?: number;
  allowHalf?: boolean;
  defaultValue?: number;
  activeColor?: string;
  voidColor?: string;
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
  <div class="mat-rate">
    <label
      v-if="label"
      class="field-label"
      :style="{ color: labelColor || undefined }"
    >
      {{ label }}
    </label>
    <el-rate
      v-model="value"
      :max="max ?? 5"
      :allow-half="allowHalf"
      :disabled="disabled"
      :active-color="activeColor || undefined"
      :void-color="voidColor || undefined"
    />
  </div>
</template>

<style scoped lang="scss">
.mat-rate {
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
