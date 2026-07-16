<script setup lang="ts">
import { computed } from 'vue';

interface GridItem {
  title: string;
  icon?: string;
  image?: string;
}

const props = defineProps<{
  items?: GridItem[] | string;
  columns?: number;
  gap?: number;
}>();

const listItems = computed<GridItem[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items as GridItem[];
  if (typeof props.items === 'string' && props.items.trim()) {
    try {
      const parsed = JSON.parse(props.items);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // 解析失败回退默认
    }
  }
  return [
    { title: '宫格一', icon: 'Menu', image: '' },
    { title: '宫格二', icon: 'Grid', image: '' },
    { title: '宫格三', icon: 'Picture', image: '' },
    { title: '宫格四', icon: 'Star', image: '' },
  ];
});

const cols = computed(() => Math.max(1, props.columns ?? 3));
const gapVal = computed(() => props.gap ?? 12);
</script>

<template>
  <div
    class="mat-grid-list"
    :style="{
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: gapVal + 'px',
    }"
  >
    <div v-for="(item, i) in listItems" :key="i" class="grid-item">
      <div class="grid-icon">
        <img v-if="item.image" :src="item.image" />
        <el-icon v-else-if="item.icon"><component :is="item.icon" /></el-icon>
        <span v-else>图</span>
      </div>
      <div class="grid-title">{{ item.title }}</div>
    </div>
  </div>
</template>

<style scoped>
.mat-grid-list {
  display: grid;
  width: 100%;
  padding: 8px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 16px 8px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.grid-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  font-size: 22px;
  color: var(--color-text-2);
  background: var(--color-bg-3);
  border-radius: var(--radius-sm);
}

.grid-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid-title {
  font-size: 12px;
  color: var(--color-text-2);
}
</style>
