<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  total?: number;
  pageSize?: number;
  layout?: string;
  background?: boolean;
}>();

const currentPage = ref(1);
</script>

<template>
  <div class="mat-pagination">
    <el-pagination
      v-model:current-page="currentPage"
      :total="total ?? 100"
      :page-size="pageSize ?? 10"
      :layout="layout ?? 'prev, pager, next'"
      :background="background ?? true"
    />
  </div>
</template>

<style scoped>
.mat-pagination {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 8px 0;
}
</style>
