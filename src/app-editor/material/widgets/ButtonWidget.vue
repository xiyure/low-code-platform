<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue';
import * as Icons from '@element-plus/icons-vue';

type ButtonType = '' | 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type ButtonSize = '' | 'large' | 'default' | 'small';

const props = defineProps<{
  text?: string;
  type?: string;
  size?: string;
  disabled?: boolean;
  loading?: boolean;
  plain?: boolean;
  round?: boolean;
  icon?: string;
}>();

const buttonType = computed<ButtonType>(() => (props.type ?? 'default') as ButtonType);
const buttonSize = computed<ButtonSize>(() => (props.size ?? 'default') as ButtonSize);

const iconComp = computed<Component | undefined>(() => {
  if (!props.icon) return undefined;
  const comp = (Icons as Record<string, Component>)[props.icon];
  return comp ? markRaw(comp) : undefined;
});
</script>

<template>
  <el-button
    class="mat-button"
    :type="buttonType"
    :size="buttonSize"
    :disabled="props.disabled"
    :loading="props.loading"
    :plain="props.plain"
    :round="props.round"
  >
    <el-icon v-if="iconComp"><component :is="iconComp" /></el-icon>
    <span>{{ props.text ?? '按钮' }}</span>
  </el-button>
</template>

<style scoped lang="scss">
.mat-button {
  display: inline-flex;
  width: 100%;
}
</style>
