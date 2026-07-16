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
      <div v-if="!$slots.default" class="card-placeholder">卡片内容区</div>
    </div>
  </el-card>
</template>

<style scoped>
.mat-card {
  width: 100%;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  font-size: 13px;
  color: var(--color-text-4);
}
</style>
