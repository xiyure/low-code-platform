<script setup lang="ts">
import { computed, type CSSProperties, type Component } from 'vue';
import type { ComponentNode } from '@/types';
import Container from './widgets/Container.vue';
import ButtonWidget from './widgets/ButtonWidget.vue';
import InputWidget from './widgets/InputWidget.vue';
import TextBlock from './widgets/TextBlock.vue';
import ImageBlock from './widgets/ImageBlock.vue';
import DataTable from './widgets/DataTable.vue';

const props = defineProps<{ node: ComponentNode }>();

const componentMap: Record<string, Component> = {
  container: Container,
  button: ButtonWidget,
  input: InputWidget,
  text: TextBlock,
  image: ImageBlock,
  table: DataTable,
};

const Comp = computed<Component>(() => componentMap[props.node.componentId] ?? TextBlock);

/** 将 node.style（kebab/camel 字符串）转为 Vue style 对象 */
const wrapperStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {};
  for (const [k, v] of Object.entries(props.node.style ?? {})) {
    const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    (s as Record<string, string>)[camel] = v;
  }
  return s;
});
</script>

<template>
  <div class="comp-wrapper" :style="wrapperStyle">
    <component :is="Comp" v-bind="node.props" />
  </div>
</template>

<style scoped>
.comp-wrapper {
  width: 100%;
}
</style>
