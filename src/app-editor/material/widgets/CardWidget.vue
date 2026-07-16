<script setup lang="ts">
defineProps<{
  title?: string;
  shadow?: 'always' | 'hover' | 'never';
  padding?: number;
}>();
</script>

<template>
  <el-card
    class="mat-card"
    :shadow="shadow ?? 'hover'"
    :body-style="{ padding: (padding ?? 16) + 'px' }"
  >
    <template v-if="title" #header>
      <span class="card-title">{{ title }}</span>
    </template>
    <div class="card-body">
      <slot />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.mat-card {
  width: 100%;
  /* 覆盖 el-card 默认 overflow: hidden，避免裁剪子组件选中时上方工具栏（top: -28px） */
  overflow: visible;

  .card-title {
    font-size: 14px;
    font-weight: 600;
  }

  .card-body {
    width: 100%;
    min-height: 80px;
  }
}
</style>
