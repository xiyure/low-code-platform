<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  columns?: number;
  rows?: number;
  stripe?: boolean;
  border?: boolean;
  size?: string;
}>();

const cols = computed(() => props.columns ?? 3);
const rws = computed(() => props.rows ?? 3);

const colLabels = computed(() =>
  Array.from({ length: cols.value }, (_, i) => `列${i + 1}`),
);
</script>

<template>
  <el-table
    :data="Array.from({ length: rws }, (_, r) => ({ row: r + 1 }))"
    :stripe="props.stripe"
    :border="props.border"
    :size="(props.size as any) ?? 'default'"
    class="mat-table"
  >
    <el-table-column
      v-for="(label, i) in colLabels"
      :key="i"
      :label="label"
      :prop="`col${i}`"
    >
      <template #default="{ row }">单元格 {{ row.row }}-{{ i + 1 }}</template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.mat-table {
  width: 100%;
}
</style>
