<script setup lang="ts">
const props = defineProps<{
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  align?: 'left' | 'center' | 'right';
}>();
</script>

<template>
  <!-- 颜色通过外层 .comp-wrapper 的 color 继承，避免属性 Tab 与样式 Tab 冲突 -->
  <div
    class="mat-text"
    :style="{
      fontSize: (props.fontSize ?? 14) + 'px',
      fontWeight: props.fontWeight ?? '400',
      textAlign: props.align ?? 'left',
    }"
  >
    {{ props.content ?? '这是一段文本' }}
  </div>
</template>

<style scoped lang="scss">
.mat-text {
  width: 100%;
  line-height: 1.6;
  word-break: break-word;
}
</style>
