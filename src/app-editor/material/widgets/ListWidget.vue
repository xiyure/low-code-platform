<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  items?: string[] | string;
  border?: boolean;
  size?: 'large' | 'default' | 'small';
}>();

const listItems = computed<string[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items;
  if (typeof props.items === 'string' && props.items.trim()) {
    return props.items.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return ['列表项一', '列表项二', '列表项三'];
});
</script>

<template>
  <div class="mat-list">
    <ul :class="{ bordered: border }">
      <li
        v-for="(item, i) in listItems"
        :key="i"
        :class="`list-item size-${size ?? 'default'}`"
      >
        <span class="item-index">{{ i + 1 }}</span>
        <span class="item-text">{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.mat-list {
  width: 100%;

  .bordered {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    .list-item {
      &:last-child {
        border-bottom: none;
      }
    }
  }

  .list-item {
    display: flex;
    gap: 8px;
    align-items: center;
    border-bottom: 1px solid var(--color-border);

    .item-index {
      flex-shrink: 0;
      min-width: 20px;
      height: 20px;
      font-size: 11px;
      line-height: 20px;
      color: var(--color-text-4);
      text-align: center;
      background: var(--color-bg-2);
      border-radius: 50%;
    }

    .item-text {
      color: var(--color-text-2);
    }
  }

  .size-large {
    padding: 14px 16px;
    font-size: 15px;
  }

  .size-default {
    padding: 10px 14px;
    font-size: 13px;
  }

  .size-small {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
