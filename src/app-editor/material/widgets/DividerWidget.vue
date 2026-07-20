<script setup lang="ts">
defineProps<{
  direction?: 'horizontal' | 'vertical';
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}>();
</script>

<template>
  <el-divider
    :direction="direction || 'horizontal'"
    :class="`mat-divider--${borderStyle || 'solid'}`"
    :style="{ '--el-border-color': color || undefined }"
  />
</template>

<style scoped lang="scss">
/* el-divider 水平线用 background-color 画线，颜色读取 --el-border-color 变量 */

/* 虚线/点线：el-divider 原生不支持，需关闭背景改用 border-top 模拟 */
.mat-divider--dashed,
.mat-divider--dotted {
  :deep(.el-divider--horizontal) {
    height: 0;
    background: transparent;
    border-top-width: 1px;
    border-top-style: var(--bs);
    border-top-color: var(--el-border-color);
  }
}

.mat-divider--dashed {
  --bs: dashed;
}

.mat-divider--dotted {
  --bs: dotted;
}
</style>
