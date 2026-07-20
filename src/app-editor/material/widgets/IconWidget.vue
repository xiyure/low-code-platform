<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue';
import * as Icons from '@element-plus/icons-vue';

const props = defineProps<{
  name?: string;
  size?: number;
  color?: string;
}>();

const iconComp = computed(() =>
  markRaw((Icons as Record<string, Component>)[props.name ?? 'Star']),
);
</script>

<template>
  <el-icon
    :style="{
      fontSize: (size ?? 24) + 'px',
      color: color || undefined,
    }"
  >
    <component :is="iconComp" />
  </el-icon>
</template>
