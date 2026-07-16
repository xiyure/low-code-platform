<script setup lang="ts">
import { onMounted } from 'vue';
import { useSpaceStore } from '@/store/spaceStore';

const spaceStore = useSpaceStore();
onMounted(() => spaceStore.init());
</script>

<template>
  <router-view />
</template>
