<script setup lang="ts">
defineProps<{ src?: string; alt?: string; radius?: number }>();
</script>

<template>
  <div class="mat-image">
    <img
      v-if="src"
      :src="src"
      :alt="alt ?? '图片'"
      :style="{ borderRadius: (radius ?? 8) + 'px' }"
    />
    <div v-else class="image-placeholder">
      <span>图片占位</span>
    </div>
  </div>
</template>

<style scoped>
.mat-image {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.mat-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 13px;
  color: var(--color-text-4);
  background: var(--color-bg-3);
  border-radius: var(--radius-md);
}
</style>
