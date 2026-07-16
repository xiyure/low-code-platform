<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ columns?: number; rows?: number }>();
const cols = computed(() => props.columns ?? 3);
const rws = computed(() => props.rows ?? 3);
</script>

<template>
  <table class="mat-table">
    <thead>
      <tr>
        <th v-for="c in cols" :key="c">列 {{ c }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rws" :key="r">
        <td v-for="c in cols" :key="c">单元格 {{ r }}-{{ c }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.mat-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.mat-table th,
.mat-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--color-border);
}

.mat-table th {
  font-weight: 600;
  color: var(--color-text-2);
  background: var(--color-bg-2);
}

.mat-table td {
  color: var(--color-text-2);
}
</style>
