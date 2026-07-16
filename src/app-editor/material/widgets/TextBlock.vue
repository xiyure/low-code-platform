<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  content?: string;
  level?: number;
  align?: 'left' | 'center' | 'right';
}>();

const tag = computed(() => {
  const lv = props.level ?? 3;
  if (lv >= 4) return 'p';
  return `h${lv}`;
});

const size = computed(() => {
  const lv = props.level ?? 3;
  if (lv === 1) return '24px';
  if (lv === 2) return '20px';
  if (lv === 3) return '16px';
  return '14px';
});
</script>

<template>
  <component
    :is="tag"
    :style="{
      textAlign: align ?? 'left',
      margin: 0,
      fontSize: size,
      fontWeight: (level ?? 3) <= 3 ? 600 : 400,
    }"
  >
    {{ content ?? '文本内容' }}
  </component>
</template>
