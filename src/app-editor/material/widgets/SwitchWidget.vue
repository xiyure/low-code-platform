<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label?: string;
  disabled?: boolean;
  activeText?: string;
  inactiveText?: string;
  defaultValue?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  labelColor?: string;
}>();

const value = ref(props.defaultValue ?? false);

defineExpose({
  getValue: () => value.value,
  setValue: (v: boolean) => {
    value.value = v;
  },
});
</script>

<template>
  <div class="mat-switch">
    <label
      v-if="label"
      class="field-label"
      :style="{ color: labelColor || undefined }"
    >
      {{ label }}
    </label>
    <el-switch
      v-model="value"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :disabled="disabled"
      :active-color="activeColor || undefined"
      :inactive-color="inactiveColor || undefined"
    />
  </div>
</template>

<style scoped lang="scss">
.mat-switch {
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
