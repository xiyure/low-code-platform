<script setup lang="ts">
defineProps<{
  direction?: 'horizontal' | 'vertical';
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}>();
</script>

<template>
  <el-divider
    :direction="direction ?? 'horizontal'"
    :style="{
      borderTopStyle: borderStyle ?? 'solid',
      borderColor: color,
    }"
  />
</template>

<style scoped>
.el-divider--vertical {
  height: 100%;
}
</style>
