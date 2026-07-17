<script setup lang="ts">
import { computed, defineAsyncComponent, markRaw, type CSSProperties, type Component } from 'vue';
import type { ComponentNode } from '@/types';

// 物料按需加载：每个 widget 拆为独立 chunk，编辑器首屏只加载用到的组件
// defineAsyncComponent 返回的组件 Vue 会自动处理加载状态，配合 markRaw 避免响应式开销
const Container = defineAsyncComponent(() => import('./widgets/Container.vue'));
const ButtonWidget = defineAsyncComponent(() => import('./widgets/ButtonWidget.vue'));
const InputWidget = defineAsyncComponent(() => import('./widgets/InputWidget.vue'));
const TextBlock = defineAsyncComponent(() => import('./widgets/TextBlock.vue'));
const ImageBlock = defineAsyncComponent(() => import('./widgets/ImageBlock.vue'));
const DataTable = defineAsyncComponent(() => import('./widgets/DataTable.vue'));
const TextareaWidget = defineAsyncComponent(() => import('./widgets/TextareaWidget.vue'));
const NumberWidget = defineAsyncComponent(() => import('./widgets/NumberWidget.vue'));
const SelectWidget = defineAsyncComponent(() => import('./widgets/SelectWidget.vue'));
const RadioWidget = defineAsyncComponent(() => import('./widgets/RadioWidget.vue'));
const CheckboxWidget = defineAsyncComponent(() => import('./widgets/CheckboxWidget.vue'));
const SwitchWidget = defineAsyncComponent(() => import('./widgets/SwitchWidget.vue'));
const DatePickerWidget = defineAsyncComponent(() => import('./widgets/DatePickerWidget.vue'));
const RateWidget = defineAsyncComponent(() => import('./widgets/RateWidget.vue'));
const SliderWidget = defineAsyncComponent(() => import('./widgets/SliderWidget.vue'));
const UploadWidget = defineAsyncComponent(() => import('./widgets/UploadWidget.vue'));
const HeadingWidget = defineAsyncComponent(() => import('./widgets/HeadingWidget.vue'));
const IconWidget = defineAsyncComponent(() => import('./widgets/IconWidget.vue'));
const DividerWidget = defineAsyncComponent(() => import('./widgets/DividerWidget.vue'));
const LinkWidget = defineAsyncComponent(() => import('./widgets/LinkWidget.vue'));
const ColumnsWidget = defineAsyncComponent(() => import('./widgets/ColumnsWidget.vue'));
const CardWidget = defineAsyncComponent(() => import('./widgets/CardWidget.vue'));
const TabsWidget = defineAsyncComponent(() => import('./widgets/TabsWidget.vue'));
const CollapseWidget = defineAsyncComponent(() => import('./widgets/CollapseWidget.vue'));
const ListWidget = defineAsyncComponent(() => import('./widgets/ListWidget.vue'));
const ProgressWidget = defineAsyncComponent(() => import('./widgets/ProgressWidget.vue'));
const BadgeWidget = defineAsyncComponent(() => import('./widgets/BadgeWidget.vue'));
const EmptyWidget = defineAsyncComponent(() => import('./widgets/EmptyWidget.vue'));
const PaginationWidget = defineAsyncComponent(() => import('./widgets/PaginationWidget.vue'));
const CarouselWidget = defineAsyncComponent(() => import('./widgets/CarouselWidget.vue'));
const MarkdownWidget = defineAsyncComponent(() => import('./widgets/MarkdownWidget.vue'));
const CodeBlockWidget = defineAsyncComponent(() => import('./widgets/CodeBlockWidget.vue'));
const ModalWidget = defineAsyncComponent(() => import('./widgets/ModalWidget.vue'));
const VerticalListWidget = defineAsyncComponent(() => import('./widgets/VerticalListWidget.vue'));
const HorizontalListWidget = defineAsyncComponent(() => import('./widgets/HorizontalListWidget.vue'));
const GridListWidget = defineAsyncComponent(() => import('./widgets/GridListWidget.vue'));
const WaterfallWidget = defineAsyncComponent(() => import('./widgets/WaterfallWidget.vue'));

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
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
.comp-wrapper {
  width: 100%;
}
</style>
