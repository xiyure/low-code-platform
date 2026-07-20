<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  content?: string;
  level?: number;
  align?: 'left' | 'center' | 'right';
}>();

const tag = computed(() => `h${props.level ?? 1}`);

const fontSize = computed(() => {
  const map: Record<number, string> = {
    1: '28px',
    2: '24px',
    3: '20px',
    4: '16px',
    5: '14px',
    6: '12px',
  };
  return map[props.level ?? 1] ?? '16px';
});

const fontWeight = computed(() => {
  const lv = props.level ?? 1;
  return lv >= 1 && lv <= 3 ? 600 : 500;
});
</script>

<template>
  <!-- 颜色通过外层 .comp-wrapper 的 color 继承，避免属性 Tab 与样式 Tab 冲突 -->
  <component
    :is="tag"
    :style="{
      textAlign: align ?? 'left',
      margin: 0,
      fontSize: fontSize,
      fontWeight: fontWeight,
    }"
  >
    {{ content ?? '标题内容' }}
  </component>
</template>
