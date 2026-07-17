<script setup lang="ts">
import { computed, watch } from 'vue';
import type { ComponentNode, ComponentEvent } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { materialRegistry } from '@/app-editor/material/registry';
import ComponentRenderer from '@/app-editor/material/ComponentRenderer.vue';
import SlotContainer from './SlotContainer.vue';
import { Delete, CopyDocument, Top, Bottom } from '@element-plus/icons-vue';

defineOptions({ name: 'NodeWrapper' });

const props = defineProps<{
  node: ComponentNode;
  /** 预览模式：只渲染 + 事件透传，无选中/工具栏/draggable */
  readonly?: boolean;
  /** 预览模式事件回调（由 AppPreview 注入，层层透传到子节点） */
  eventHandler?: (node: ComponentNode, eventType: ComponentEvent['type']) => void;
  inputHandler?: (node: ComponentNode, value: string) => void;
}>();

const editor = useEditorStore();

const isContainer = computed(() => !!materialRegistry[props.node.componentId]?.isContainer);
const selected = computed(() => !props.readonly && editor.selectedId === props.node.id);

// ===== 多 slot 支持（折叠面板等） =====
// 对于有多 slot 的容器组件（如折叠面板），根据 props.items 生成 slot 名称列表。
// 每个面板对应一个命名 slot（panel-0, panel-1, ...），可独立拖入组件。
function parseSlotCount(node: ComponentNode): number {
  if (node.componentId === 'collapse') {
    const raw = node.props.items;
    if (Array.isArray(raw) && raw.length) return raw.length;
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed.length;
      } catch {
        // 解析失败
      }
    }
    return 2; // 默认 2 个面板
  }
  return 0;
}

const slotNames = computed<string[]>(() => {
  const count = parseSlotCount(props.node);
  return Array.from({ length: count }, (_, i) => 'panel-' + i);
});

const hasSlots = computed(() => slotNames.value.length > 0);

// 确保 node.slots 存在且每个 slotName 有对应数组（面板数量变化时同步增删）
// 通过 editorStore.ensureSlots 修改，避免直接 mutating props
watch(
  slotNames,
  (names) => {
    if (props.readonly || names.length === 0) return;
    editor.ensureSlots(props.node.id, names);
  },
  { immediate: true },
);

// ===== 选中（编辑模式）/ 事件透传（预览模式） =====
function onClick(e: MouseEvent): void {
  e.stopPropagation();
  if (props.readonly) {
    props.eventHandler?.(props.node, 'click');
  } else {
    editor.selectNode(props.node.id);
  }
}

function onDblClick(e: MouseEvent): void {
  if (props.readonly) {
    e.stopPropagation();
    props.eventHandler?.(props.node, 'doubleClick');
  }
}

function onMouseEnter(): void {
  if (props.readonly) props.eventHandler?.(props.node, 'mouseEnter');
}

function onMouseLeave(): void {
  if (props.readonly) props.eventHandler?.(props.node, 'mouseLeave');
}

function onInput(e: Event): void {
  if (!props.readonly) return;
  const target = e.target as HTMLInputElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    e.stopPropagation();
    props.inputHandler?.(props.node, target.value);
  }
}

function onChange(e: Event): void {
  if (!props.readonly) return;
  e.stopPropagation();
  props.eventHandler?.(props.node, 'change');
}

// ===== 容器整体拖入（解决列表类组件拖拽） =====
// 列表类组件（vlist/hlist/gridlist/waterfall）的 <slot /> 在列表项下方，
// 拖到列表项区域时 dragover 事件不会触发 SlotContainer 的 onDragOver（事件不向上冒泡到子元素）。
// 因此在 NodeWrapper 最外层 div 上绑定 dragover/drop，
// 让整个容器区域都接受物料库拖入。SlotContainer 自身的 onDrop 已 stopPropagation，不会重复触发。
function onContainerDragOver(e: DragEvent): void {
  if (props.readonly) return;
  // 仅非多 slot 的容器型节点生效（多 slot 容器如折叠面板由各面板的 SlotContainer 处理）
  if (!isContainer.value || hasSlots.value) return;
  if (!e.dataTransfer?.types.includes('application/x-material-id')) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
}

function onContainerDrop(e: DragEvent): void {
  if (props.readonly) return;
  if (!isContainer.value || hasSlots.value) return;
  const materialId = e.dataTransfer?.getData('application/x-material-id');
  if (!materialId) return;
  e.preventDefault();
  e.stopPropagation();
  editor.addNode(materialId, undefined, props.node.id);
}

// ===== 尺寸拉伸（编辑模式，右下角） =====
const MIN_W = 80;
const MIN_H = 32;
let startX = 0;
let startY = 0;
let startW = 0;
let startH = 0;
let resized = false;

function onResizeStart(e: PointerEvent, w: number, h: number): void {
  if (e.button !== 0) return;
  e.stopPropagation();
  e.preventDefault();
  startX = e.clientX;
  startY = e.clientY;
  startW = w;
  startH = h;
  resized = false;
  editor.beginResize();
  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', onResizeEnd);
}

function onResizeMove(e: PointerEvent): void {
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) resized = true;
  const w = Math.max(MIN_W, startW + dx);
  const h = Math.max(MIN_H, startH + dy);
  editor.updateSize(props.node.id, { width: w, height: h });
}

function onResizeEnd(): void {
  if (resized) editor.endResize();
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);
}
</script>

<template>
  <div
    class="node-wrapper"
    :class="{ selected, 'is-container': isContainer, readonly }"
    :style="{ width: node.size.width + 'px' }"
    :data-node-id="node.id"
    @click="onClick"
    @dblclick="onDblClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @input="onInput"
    @change="onChange"
    @dragover="onContainerDragOver"
    @drop="onContainerDrop"
  >
    <ComponentRenderer :node="node">
      <!-- 多 slot 容器（折叠面板）：为每个面板渲染独立的 SlotContainer -->
      <template v-for="slotName in slotNames" :key="slotName" #[slotName]>
        <SlotContainer
          :children="node.slots?.[slotName] ?? []"
          :parent-id="node.id"
          :slot-name="slotName"
          :readonly="readonly"
          :event-handler="eventHandler"
          :input-handler="inputHandler"
          placeholder="拖入组件"
        />
      </template>

      <!-- 默认 slot（普通容器：container/card/columns/列表类） -->
      <template v-if="isContainer && !hasSlots">
        <SlotContainer
          :children="node.children"
          :parent-id="node.id"
          :readonly="readonly"
          :event-handler="eventHandler"
          :input-handler="inputHandler"
          :placeholder="`拖入组件到${node.name}`"
        />
      </template>
    </ComponentRenderer>

    <!-- 编辑态：选中时显示工具栏 -->
    <div v-if="!readonly && selected" class="node-topbar" @click.stop @mousedown.stop>
      <span class="topbar-name">{{ node.name }}</span>
      <div class="topbar-actions">
        <el-button class="tool-btn" text size="small" title="上移" @click="editor.moveUp(node.id)">
          <el-icon><Top /></el-icon>
        </el-button>
        <el-button class="tool-btn" text size="small" title="下移" @click="editor.moveDown(node.id)">
          <el-icon><Bottom /></el-icon>
        </el-button>
        <el-button class="tool-btn" text size="small" title="复制" @click="editor.duplicateNode(node.id)">
          <el-icon><CopyDocument /></el-icon>
        </el-button>
        <el-button class="tool-btn danger" text size="small" title="删除" @click="editor.removeNode(node.id)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 拉伸手柄：选中时显示，仅右下角 -->
    <span
      v-if="!readonly && selected"
      class="resize-handle rh-se"
      @pointerdown="onResizeStart($event, node.size.width, node.size.height)"
    ></span>
  </div>
</template>

<style scoped lang="scss">
.node-wrapper {
  position: relative;
  background: var(--color-bg-1);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: var(--color-primary);
  }

  &.selected {
    /* 选中节点整体提升层级，确保容器内子组件的工具栏/手柄不被容器遮挡 */
    z-index: 100;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  /* 预览模式：去掉边框与背景 */
  &.readonly {
    background: transparent;
    border-color: transparent;

    &:hover {
      border-color: transparent;
      box-shadow: none;
    }
  }

  /* 容器型节点 */
  &.is-container {
    background: transparent;
  }

  /* 顶部工具栏（选中时显示）：z-index 远高于节点本身，确保在选中节点的层叠上下文内始终最上层 */
  .node-topbar {
    position: absolute;
    top: -28px;
    left: 0;
    z-index: 1000;
    display: flex;
    gap: 4px;
    align-items: center;
    height: 26px;
    padding: 0 4px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);

    .topbar-name {
      max-width: 100px;
      font-size: 12px;
      color: var(--color-text-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .topbar-actions {
      display: flex;
      gap: 1px;
    }

    .tool-btn {
      width: 24px;
      height: 22px;
      padding: 0;
      color: var(--color-text-2);
      transition:
        background 0.15s,
        color 0.15s;

      &:hover {
        color: var(--color-primary);
        background: var(--color-primary-light);
      }

      &.danger:hover {
        color: var(--color-danger);
        background: rgb(245 63 63 / 10%);
      }
    }
  }

  /* 拉伸手柄（仅右下角）：与 topbar 同层级，确保始终可点 */
  .resize-handle {
    position: absolute;
    z-index: 1001;
    background: var(--color-primary);
    border: 2px solid var(--color-bg-1);
    border-radius: 3px;

    &.rh-se {
      right: -6px;
      bottom: -6px;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }
  }
}

.drag-ghost {
  opacity: 0.4;
}

.drag-chosen {
  border-color: var(--color-primary) !important;
}
</style>
