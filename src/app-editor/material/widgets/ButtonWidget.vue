<script setup lang="ts">
defineProps<{ text?: string; type?: 'primary' | 'default' | 'success' | 'danger' }>();
</script>

<template>
  <el-button class="mat-button" :type="type ?? 'default'">{{ text ?? '按钮' }}</el-button>
</template>

<style scoped>
.mat-button {
  display: block;
  width: 100%;
}
</style>
