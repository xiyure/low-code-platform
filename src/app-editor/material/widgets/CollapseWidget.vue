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
        <div class="collapse-content">
          <!--
            每个面板用独立的命名 slot（panel-0, panel-1, ...），
            NodeWrapper 为每个面板提供独立的 SlotContainer，
            各面板可独立拖入组件，互不影响。
          -->
          <slot :name="'panel-' + i" />
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped lang="scss">
.mat-collapse {
  width: 100%;

  .collapse-content {
    width: 100%;
    min-height: 80px;
    /* 顶部留白：子组件选中时工具栏位于上方（top: -28px），需确保它不超出
       el-collapse-item__wrap 的 overflow: hidden 边界，避免被裁剪 */
    padding-top: 32px;
  }
}
</style>
