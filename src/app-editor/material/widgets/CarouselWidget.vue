<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  items?: string[] | string;
  height?: string;
  interval?: number;
  arrow?: 'always' | 'hover' | 'never';
  type?: '' | 'card';
}>();

const slides = computed<string[]>(() => {
  if (Array.isArray(props.items) && props.items.length) return props.items;
  if (typeof props.items === 'string' && props.items.trim()) {
    return props.items.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return ['轮播图一', '轮播图二', '轮播图三'];
});
</script>

<template>
  <div class="mat-carousel">
    <el-carousel
      :height="height ?? '200px'"
      :interval="interval ?? 3000"
      :arrow="(arrow as any) ?? 'hover'"
      :type="(type as any) === 'card' ? 'card' : ''"
    >
      <el-carousel-item v-for="(slide, i) in slides" :key="i">
        <div class="carousel-slide">
          <img v-if="slide.startsWith('http') || slide.startsWith('/')" :src="slide" class="slide-img" />
          <span v-else class="slide-text">{{ slide }}</span>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<style scoped lang="scss">
.mat-carousel {
  width: 100%;
}

.carousel-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #1975ff);
  border-radius: var(--radius-md);
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-text {
  font-size: 18px;
  font-weight: 600;
}
</style>
