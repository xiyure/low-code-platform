<script setup lang="ts">
import { computed } from 'vue';

interface WaterfallItem {
  title: string;
  image?: string;
  height?: number;
}

const props = defineProps<{
  items?: WaterfallItem[] | string;
  columns?: number;
  gap?: number;
}>();

const listItems = computed<WaterfallItem[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items as WaterfallItem[];
  if (typeof props.items === 'string' && props.items.trim()) {
    try {
      const parsed = JSON.parse(props.items);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // 解析失败回退默认
    }
  }
  return [
    { title: '卡片一', image: '', height: 160 },
    { title: '卡片二', image: '', height: 120 },
    { title: '卡片三', image: '', height: 180 },
    { title: '卡片四', image: '', height: 100 },
    { title: '卡片五', image: '', height: 140 },
    { title: '卡片六', image: '', height: 160 },
  ];
});

/** 按列数将项目分到各列，模拟瀑布流 */
const columnsData = computed<WaterfallItem[][]>(() => {
  const n = Math.max(1, props.columns ?? 2);
  const cols: WaterfallItem[][] = Array.from({ length: n }, () => []);
  listItems.value.forEach((item, i) => {
    cols[i % n].push(item);
  });
  return cols;
});

const gapVal = computed(() => props.gap ?? 12);
</script>

<template>
  <div class="mat-waterfall-wrap">
    <div class="mat-waterfall" :style="{ gap: gapVal + 'px' }">
      <div
        v-for="(col, ci) in columnsData"
        :key="ci"
        class="waterfall-col"
        :style="{ gap: gapVal + 'px' }"
      >
        <div
          v-for="(item, i) in col"
          :key="i"
          class="waterfall-card"
        >
          <div
            class="waterfall-image"
            :style="{ height: (item.height ?? 140) + 'px' }"
          >
            <img v-if="item.image" :src="item.image" />
            <span v-else>图</span>
          </div>
          <div class="waterfall-title">{{ item.title }}</div>
        </div>
      </div>
    </div>
    <!-- 自定义内容区：可拖入子组件 -->
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mat-waterfall-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.mat-waterfall {
  display: flex;
  width: 100%;

  .waterfall-col {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    .waterfall-card {
      background: var(--color-bg-1);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);

      .waterfall-image {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
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

      .waterfall-title {
        padding: 8px 10px;
        font-size: 13px;
        color: var(--color-text-1);
      }
    }
  }
}
</style>
