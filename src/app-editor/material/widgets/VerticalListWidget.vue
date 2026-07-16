<script setup lang="ts">
import { computed } from 'vue';

interface ListItem {
  title: string;
  desc?: string;
  image?: string;
}

const props = defineProps<{
  items?: ListItem[] | string;
  gap?: number;
  showImage?: boolean;
}>();

const listItems = computed<ListItem[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items as ListItem[];
  if (typeof props.items === 'string' && props.items.trim()) {
    try {
      const parsed = JSON.parse(props.items);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // 解析失败回退默认
    }
  }
  return [
    { title: '列表项一', desc: '这是列表项描述', image: '' },
    { title: '列表项二', desc: '这是列表项描述', image: '' },
    { title: '列表项三', desc: '这是列表项描述', image: '' },
  ];
});
</script>

<template>
  <div class="mat-vlist" :style="{ gap: (props.gap ?? 8) + 'px' }">
    <div v-for="(item, i) in listItems" :key="i" class="vlist-item">
      <div v-if="showImage" class="vlist-image">
        <img v-if="item.image" :src="item.image" />
        <span v-else>图</span>
      </div>
      <div class="vlist-content">
        <div class="vlist-title">{{ item.title }}</div>
        <div v-if="item.desc" class="vlist-desc">{{ item.desc }}</div>
      </div>
    </div>
    <!-- 自定义内容区：可拖入子组件 -->
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mat-vlist {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);

  .vlist-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    .vlist-image {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      overflow: hidden;
      font-size: 12px;
      color: var(--color-text-4);
      background: var(--color-bg-3);
      border-radius: var(--radius-sm);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .vlist-content {
      flex: 1;
      min-width: 0;

      .vlist-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      .vlist-desc {
        margin-top: 2px;
        font-size: 12px;
        color: var(--color-text-3);
      }
    }
  }
}
</style>
