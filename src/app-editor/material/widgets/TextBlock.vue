<script setup lang="ts">
const props = defineProps<{
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}>();
</script>

<template>
  <div
    class="mat-text"
    :style="{
      fontSize: (props.fontSize ?? 14) + 'px',
      fontWeight: props.fontWeight ?? '400',
      color: props.color ?? '#1f2329',
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
