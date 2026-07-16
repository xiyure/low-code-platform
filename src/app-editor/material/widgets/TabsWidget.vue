<script setup lang="ts">
import { ref, computed } from 'vue';

interface TabItem {
  label: string;
  content: string;
}

type TabType = '' | 'card' | 'border-card';
type TabPosition = 'top' | 'right' | 'bottom' | 'left';

const props = defineProps<{
  items?: TabItem[] | string;
  type?: string;
  position?: string;
}>();

const activeTab = ref('0');

const tabItems = computed<TabItem[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items as TabItem[];
  if (typeof props.items === 'string' && props.items.trim()) {
    try {
      const parsed = JSON.parse(props.items);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // JSON 解析失败，回退默认值
    }
  }
  return [{ label: '标签一', content: '内容一' }, { label: '标签二', content: '内容二' }];
});

const tabType = computed<TabType>(() => {
  const v = props.type;
  if (v === 'card' || v === 'border-card') return v;
  return '';
});

const tabPosition = computed<TabPosition>(() => {
  const v = props.position;
  if (v === 'top' || v === 'right' || v === 'bottom' || v === 'left') return v;
  return 'top';
});
</script>

<template>
  <div class="mat-tabs">
    <el-tabs v-model="activeTab" :type="tabType" :tab-position="tabPosition">
      <el-tab-pane
        v-for="(tab, i) in tabItems"
        :key="i"
        :label="tab.label"
        :name="String(i)"
      >
        <div class="tab-content">{{ tab.content }}</div>
      </el-tab-pane>
    </el-tabs>
    <div v-if="$slots.default" class="tabs-slot"><slot /></div>
    <div v-else class="tabs-placeholder">将组件拖入标签页</div>
  </div>
</template>

<style scoped>
.mat-tabs {
  width: 100%;
}

.tab-content {
  padding: 12px;
  font-size: 13px;
  color: var(--color-text-2);
}

.tabs-slot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.tabs-placeholder {
  padding: 16px;
  font-size: 13px;
  color: var(--color-text-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  text-align: center;
}
</style>
