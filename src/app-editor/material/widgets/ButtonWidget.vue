<script setup lang="ts">
import { computed } from 'vue';

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
    <el-icon v-if="props.icon"><component :is="props.icon" /></el-icon>
    <span>{{ props.text ?? '按钮' }}</span>
  </el-button>
</template>

<style scoped lang="scss">
.mat-button {
  display: inline-flex;
  width: 100%;
}
</style>
