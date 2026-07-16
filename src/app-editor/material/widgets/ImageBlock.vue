<script setup lang="ts">
const props = defineProps<{
  src?: string;
  alt?: string;
  fit?: 'fill' | 'cover' | 'contain' | 'none';
  radius?: number;
}>();
</script>

<template>
  <div class="mat-image" :style="{ borderRadius: (props.radius ?? 8) + 'px' }">
    <img
      v-if="props.src"
      :src="props.src"
      :alt="props.alt ?? '图片'"
      :style="{ objectFit: props.fit ?? 'cover' }"
    />
    <div v-else class="image-placeholder">
      <span>图片占位</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mat-image {
  width: 100%;
  height: 100%;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: 100%;
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
}
</style>
