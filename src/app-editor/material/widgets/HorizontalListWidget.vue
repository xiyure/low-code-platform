<script setup lang="ts">
import { computed } from 'vue';

interface CardItem {
  title: string;
  image?: string;
}

const props = defineProps<{
  items?: CardItem[] | string;
  gap?: number;
  cardWidth?: number;
}>();

const listItems = computed<CardItem[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items as CardItem[];
  if (typeof props.items === 'string' && props.items.trim()) {
    try {
      const parsed = JSON.parse(props.items);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // 解析失败回退默认
    }
  }
  return [
    { title: '卡片一', image: '' },
    { title: '卡片二', image: '' },
    { title: '卡片三', image: '' },
    { title: '卡片四', image: '' },
  ];
});
</script>

<template>
  <div
    class="mat-hlist"
    :style="{ gap: (props.gap ?? 12) + 'px' }"
  >
    <div
      v-for="(item, i) in listItems"
      :key="i"
      class="hlist-card"
      :style="{ width: (props.cardWidth ?? 140) + 'px' }"
    >
      <div class="hlist-image">
        <img v-if="item.image" :src="item.image" />
        <span v-else>图</span>
      </div>
      <div class="hlist-title">{{ item.title }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mat-hlist {
  display: flex;
  width: 100%;
  padding: 8px;
  overflow-x: auto;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);

  .hlist-card {
    flex-shrink: 0;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    .hlist-image {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 80px;
      overflow: hidden;
      font-size: 12px;
      color: var(--color-text-4);
      background: var(--color-bg-3);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .hlist-title {
      padding: 8px 10px;
      font-size: 13px;
      color: var(--color-text-1);
    }
  }
}
</style>
