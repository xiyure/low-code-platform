<script setup lang="ts">
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';
import type { ComponentNode, ComponentEvent } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { materialRegistry } from '@/app-editor/material/registry';
import ComponentRenderer from '@/app-editor/material/ComponentRenderer.vue';
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
const dragOver = ref(false);

// ===== 选中（编辑模式）/ 事件透传（预览模式） =====
function onClick(e: MouseEvent): void {
  if (props.readonly) {
    e.stopPropagation();
    props.eventHandler?.(props.node, 'click');
  } else {
    e.stopPropagation();
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

// ===== vuedraggable 跨列表拖拽（编辑模式） =====
const dragOptions = {
  animation: 180,
  group: { name: 'canvas-nodes', pull: true, put: true },
  ghostClass: 'drag-ghost',
  chosenClass: 'drag-chosen',
  dragClass: 'drag-dragging',
};

/** 拖拽结束：提交历史（跨列表时由源列表触发一次） */
function onDragEnd(): void {
  editor.commitSort();
}

// ===== 物料库原生拖入容器（编辑模式） =====
function onContainerDrop(e: DragEvent): void {
  const materialId = e.dataTransfer?.getData('application/x-material-id');
  if (!materialId) return; // 非物料库拖入，交给 vuedraggable
  e.preventDefault();
  e.stopPropagation();
  dragOver.value = false;
  editor.addNode(materialId, undefined, props.node.id);
}

function onContainerDragOver(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes('application/x-material-id')) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
  dragOver.value = true;
}

function onContainerDragLeave(): void {
  dragOver.value = false;
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
    :class="{ selected, 'is-container': isContainer, 'drop-active': dragOver, readonly }"
    :style="{ width: node.size.width + 'px' }"
    @click="onClick"
    @dblclick="onDblClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @input="onInput"
    @change="onChange"
  >
    <ComponentRenderer :node="node">
      <template v-if="isContainer">
        <!-- 预览模式：递归渲染子节点，无拖拽 -->
        <template v-if="readonly">
          <NodeWrapper
            v-for="child in node.children"
            :key="child.id"
            :node="child"
            readonly
            :event-handler="eventHandler"
            :input-handler="inputHandler"
          />
        </template>
        <!-- 编辑模式：容器内嵌 vuedraggable，与顶层同 group，支持跨层拖拽与排序 -->
        <div
          v-else
          class="container-zone"
          :class="{ empty: node.children.length === 0, 'drop-active': dragOver }"
          @drop="onContainerDrop"
          @dragover="onContainerDragOver"
          @dragleave="onContainerDragLeave"
        >
          <draggable
            :list="node.children"
            v-bind="dragOptions"
            item-key="id"
            class="container-list"
            @end="onDragEnd"
          >
            <template #item="{ element }">
              <NodeWrapper :node="element" />
            </template>
          </draggable>
          <div v-if="node.children.length === 0" class="drop-hint">将组件拖入{{ node.name }}</div>
        </div>
      </template>
    </ComponentRenderer>

    <!-- 编辑态工具栏 -->
    <div v-if="!readonly && selected" class="node-toolbar" @click.stop @mousedown.stop>
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

  /* 容器内拖放区：既是 vuedraggable 容器，也是物料库原生 drop 区 */
  .container-zone {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 56px;
    padding: 6px;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
    transition: background 0.15s, border-color 0.15s;

    &.empty {
      align-items: center;
      justify-content: center;
    }

    &.drop-active {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
    }

    .container-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 24px;
    }

    .drop-hint {
      position: absolute;
      font-size: 12px;
      color: var(--color-text-4);
      pointer-events: none;
    }
  }

  .node-toolbar {
    position: absolute;
    top: -36px;
    right: 0;
    z-index: 20;
    display: flex;
    gap: 2px;
    align-items: center;
    padding: 2px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);

    .tool-btn {
      width: 26px;
      height: 26px;
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

  /* 拉伸手柄（仅右下角） */
  .resize-handle {
    position: absolute;
    z-index: 21;
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
