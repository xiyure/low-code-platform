<script setup lang="ts">
import { computed, ref } from 'vue';

interface CollapseItem {
  title: string;
  content: string;
}

const props = defineProps<{
  items?: CollapseItem[] | string;
  accordion?: boolean;
}>();

const activeNames = ref<string[]>(['0']);

const collapseItems = computed<CollapseItem[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items as CollapseItem[];
  if (typeof props.items === 'string' && props.items.trim()) {
    try {
      const parsed = JSON.parse(props.items);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // JSON 解析失败，回退默认值
    }
  }
  return [{ title: '面板一', content: '内容一' }, { title: '面板二', content: '内容二' }];
});
</script>

<template>
  <div class="mat-collapse">
    <el-collapse v-model="activeNames" :accordion="props.accordion ?? false">
      <el-collapse-item
        v-for="(item, i) in collapseItems"
        :key="i"
        :title="item.title"
        :name="String(i)"
      >
        <div class="collapse-content">{{ item.content }}</div>
      </el-collapse-item>
    </el-collapse>
    <div v-if="$slots.default" class="collapse-slot"><slot /></div>
    <div v-else class="collapse-placeholder">将组件拖入折叠面板</div>
  </div>
</template>

<style scoped lang="scss">
.mat-collapse {
  width: 100%;

  .collapse-content {
    font-size: 13px;
    color: var(--color-text-2);
  }

  .collapse-slot {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .collapse-placeholder {
    margin-top: 8px;
    padding: 16px;
    font-size: 13px;
    color: var(--color-text-4);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
    text-align: center;
  }
}
</style>
