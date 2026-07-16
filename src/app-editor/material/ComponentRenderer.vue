<script setup lang="ts">
import { computed, markRaw, type CSSProperties, type Component } from 'vue';
import type { ComponentNode } from '@/types';
import Container from './widgets/Container.vue';
import ButtonWidget from './widgets/ButtonWidget.vue';
import InputWidget from './widgets/InputWidget.vue';
import TextBlock from './widgets/TextBlock.vue';
import ImageBlock from './widgets/ImageBlock.vue';
import DataTable from './widgets/DataTable.vue';
import TextareaWidget from './widgets/TextareaWidget.vue';
import NumberWidget from './widgets/NumberWidget.vue';
import SelectWidget from './widgets/SelectWidget.vue';
import RadioWidget from './widgets/RadioWidget.vue';
import CheckboxWidget from './widgets/CheckboxWidget.vue';
import SwitchWidget from './widgets/SwitchWidget.vue';
import DatePickerWidget from './widgets/DatePickerWidget.vue';
import RateWidget from './widgets/RateWidget.vue';
import SliderWidget from './widgets/SliderWidget.vue';
import UploadWidget from './widgets/UploadWidget.vue';
import HeadingWidget from './widgets/HeadingWidget.vue';
import IconWidget from './widgets/IconWidget.vue';
import DividerWidget from './widgets/DividerWidget.vue';
import LinkWidget from './widgets/LinkWidget.vue';
import ColumnsWidget from './widgets/ColumnsWidget.vue';
import CardWidget from './widgets/CardWidget.vue';
import TabsWidget from './widgets/TabsWidget.vue';
import CollapseWidget from './widgets/CollapseWidget.vue';
import ListWidget from './widgets/ListWidget.vue';
import ProgressWidget from './widgets/ProgressWidget.vue';
import BadgeWidget from './widgets/BadgeWidget.vue';
import EmptyWidget from './widgets/EmptyWidget.vue';
import PaginationWidget from './widgets/PaginationWidget.vue';
import CarouselWidget from './widgets/CarouselWidget.vue';
import MarkdownWidget from './widgets/MarkdownWidget.vue';
import CodeBlockWidget from './widgets/CodeBlockWidget.vue';
import ModalWidget from './widgets/ModalWidget.vue';
import VerticalListWidget from './widgets/VerticalListWidget.vue';
import HorizontalListWidget from './widgets/HorizontalListWidget.vue';
import GridListWidget from './widgets/GridListWidget.vue';
import WaterfallWidget from './widgets/WaterfallWidget.vue';

const props = defineProps<{ node: ComponentNode }>();

const componentMap: Record<string, Component> = markRaw({
  container: Container,
  button: ButtonWidget,
  input: InputWidget,
  text: TextBlock,
  image: ImageBlock,
  table: DataTable,
  textarea: TextareaWidget,
  number: NumberWidget,
  select: SelectWidget,
  radio: RadioWidget,
  checkbox: CheckboxWidget,
  switch: SwitchWidget,
  datepicker: DatePickerWidget,
  rate: RateWidget,
  slider: SliderWidget,
  upload: UploadWidget,
  heading: HeadingWidget,
  icon: IconWidget,
  divider: DividerWidget,
  link: LinkWidget,
  columns: ColumnsWidget,
  card: CardWidget,
  tabs: TabsWidget,
  collapse: CollapseWidget,
  list: ListWidget,
  progress: ProgressWidget,
  badge: BadgeWidget,
  empty: EmptyWidget,
  pagination: PaginationWidget,
  carousel: CarouselWidget,
  markdown: MarkdownWidget,
  codeblock: CodeBlockWidget,
  modal: ModalWidget,
  vlist: VerticalListWidget,
  hlist: HorizontalListWidget,
  gridlist: GridListWidget,
  waterfall: WaterfallWidget,
});

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
    <component :is="Comp" v-bind="node.props">
      <slot />
    </component>
  </div>
</template>

<style scoped>
.comp-wrapper {
  width: 100%;
}
</style>
