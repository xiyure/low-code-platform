<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
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
    // 编辑模式：阻止链接跳转、弹窗打开等原生行为，仅选中组件
    e.preventDefault();
    editor.selectNode(props.node.id);
  }
}

/** 编辑模式下阻止表单元素的 mousedown 默认行为（避免 input/textarea 聚焦、按钮触发），但不阻止普通 div 的 mousedown（让 SortableJS 能发起拖拽） */
function onMouseDown(e: MouseEvent): void {
  if (props.readonly) return;
  const target = e.target as HTMLElement;
  const tag = target.tagName;
  // 仅阻止表单元素的默认行为；div/span 等容器元素放行，确保 SortableJS 拖拽正常
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || target.isContentEditable) {
    e.preventDefault();
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

// ===== 右键菜单 =====
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

/** 右键打开操作菜单（编辑模式） */
function onContextMenu(e: MouseEvent): void {
  if (props.readonly) return;
  e.preventDefault();
  e.stopPropagation();
  editor.selectNode(props.node.id);
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuVisible.value = true;
}

/** 关闭右键菜单 */
function closeContextMenu(): void {
  contextMenuVisible.value = false;
}

/** 执行菜单操作 */
function runAction(action: 'up' | 'down' | 'copy' | 'delete'): void {
  closeContextMenu();
  switch (action) {
    case 'up':
      editor.moveUp(props.node.id);
      break;
    case 'down':
      editor.moveDown(props.node.id);
      break;
    case 'copy':
      editor.duplicateNode(props.node.id);
      break;
    case 'delete':
      editor.removeNode(props.node.id);
      break;
  }
}

// 全局点击/右键时关闭菜单
function onGlobalClick(): void {
  if (contextMenuVisible.value) closeContextMenu();
}
onMounted(() => {
  window.addEventListener('click', onGlobalClick);
  window.addEventListener('contextmenu', onGlobalClick, true);
});
onUnmounted(() => {
  window.removeEventListener('click', onGlobalClick);
  window.removeEventListener('contextmenu', onGlobalClick, true);
});
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
    @mousedown="onMouseDown"
    @contextmenu="onContextMenu"
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

    <!-- 拉伸手柄：选中时显示，仅右下角 -->
    <span
      v-if="!readonly && selected"
      class="resize-handle rh-se"
      @pointerdown="onResizeStart($event, node.size.width, node.size.height)"
    ></span>

    <!-- 右键操作菜单（编辑模式） -->
    <teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
        @click.stop
        @contextmenu.prevent
      >
        <div class="context-menu-item" @click="runAction('up')">
          <el-icon><Top /></el-icon><span>上移</span>
        </div>
        <div class="context-menu-item" @click="runAction('down')">
          <el-icon><Bottom /></el-icon><span>下移</span>
        </div>
        <div class="context-menu-item" @click="runAction('copy')">
          <el-icon><CopyDocument /></el-icon><span>复制</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item danger" @click="runAction('delete')">
          <el-icon><Delete /></el-icon><span>删除</span>
        </div>
      </div>
    </teleport>
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

<style lang="scss">
/* 右键操作菜单（Teleport 到 body，不能 scoped） */
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 120px;
  padding: 4px 0;
  background: var(--color-bg-1, #fff);
  border: 1px solid var(--color-border, #e5e6eb);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);

  .context-menu-item {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 14px;
    font-size: 13px;
    color: var(--color-text-1, #1f2329);
    cursor: pointer;
    transition: background 0.12s;

    .el-icon {
      font-size: 14px;
    }

    &:hover {
      background: var(--color-primary-light, #ecf5ff);
      color: var(--color-primary, #409eff);
    }

    &.danger:hover {
      background: rgb(245 63 63 / 8%);
      color: var(--color-danger, #f53f3f);
    }
  }

  .context-menu-divider {
    height: 1px;
    margin: 4px 8px;
    background: var(--color-border, #e5e6eb);
  }
}
</style>
