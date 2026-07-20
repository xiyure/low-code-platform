<script setup lang="ts">
defineProps<{
  text?: string;
  href?: string;
  type?: string;
  underline?: 'always' | 'hover' | 'never';
  disabled?: boolean;
}>();
</script>

<template>
  <el-link
    :href="href"
    :type="(type ?? 'default') as any"
    :underline="underline ?? 'always'"
    :disabled="disabled"
    target="_blank"
  >
    {{ text ?? '链接' }}
  </el-link>
</template>

<style scoped lang="scss">
.el-link {
  width: 100%;
}
</style>
