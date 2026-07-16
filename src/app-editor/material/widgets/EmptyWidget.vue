<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue';
import { markRaw } from 'vue';

defineProps<{
  description?: string;
  imageSize?: number;
}>();

const defaultIcon = markRaw(ChatDotRound);
</script>

<template>
  <div class="mat-empty">
    <el-empty
      :description="description ?? '暂无数据'"
      :image-size="imageSize ?? 80"
    >
      <template #image>
        <el-icon :size="imageSize ?? 80" class="empty-icon">
          <component :is="defaultIcon" />
        </el-icon>
      </template>
    </el-empty>
  </div>
</template>

<style scoped>
.mat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 24px 0;
}

.empty-icon {
  color: var(--color-text-4);
}
</style>
