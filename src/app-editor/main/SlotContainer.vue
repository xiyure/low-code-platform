<script setup lang="ts">
import { ref, toRef } from 'vue';
import { useDraggable } from 'vue-draggable-plus';
import type { ComponentNode, ComponentEvent } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import NodeWrapper from './NodeWrapper.vue';
import { Plus } from '@element-plus/icons-vue';

/**
 * SlotContainer：封装单个 slot 的 container-list + SortableJS 拖拽逻辑。
 *
 * 用途：
 * - 普通容器（container/card/columns/列表类）：slotName 为空，绑定 node.children
 * - 多 slot 容器（折叠面板）：slotName 为 'panel-0' 等，绑定 node.slots['panel-0']
 *
 * 为什么需要独立组件：
 * useDraggable 是 composable，必须在 setup 顶层调用，不能在 v-for 循环中调用。
 * 多 slot 场景需要多个 useDraggable 实例，因此用独立子组件封装。
 */
const props = defineProps<{
  /** 该 slot 的子节点数组（指向 node.children 或 node.slots[slotName]） */
  children: ComponentNode[];
  /** 父节点 id（用于 addNode） */
  parentId: string;
  /** slot 名称（空字符串表示默认 slot） */
  slotName?: string;
  /** 预览模式：只渲染，无拖拽 */
  readonly?: boolean;
  /** 预览模式事件回调 */
  eventHandler?: (node: ComponentNode, eventType: ComponentEvent['type']) => void;
  inputHandler?: (node: ComponentNode, value: string) => void;
  /** 空提示文字 */
  placeholder?: string;
}>();

const editor = useEditorStore();
const containerEl = ref<HTMLElement>();
const dragOver = ref(false);

// 编辑模式：初始化 SortableJS
// toRef(props, 'children') 返回指向 props.children 的可写 ref，
// SortableJS 直接操作该数组（splice/push），由于 props.children 是父节点
// children/slots[slotName] 的引用，修改会同步到父节点。
if (!props.readonly) {
  const childrenRef = toRef(props, 'children');
  useDraggable(containerEl, childrenRef, {
    animation: 180,
    group: { name: 'canvas-nodes', pull: true, put: true },
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    dragClass: 'drag-dragging',
    swapThreshold: 0.65,
    emptyInsertThreshold: 80,
    onEnd: () => editor.commitSort(),
  });
}

/** 判断是否为物料库拖入（仅此时显示 drop 状态和接受 drop） */
function isMaterialDrag(e: DragEvent): boolean {
  return !!e.dataTransfer?.types.includes('application/x-material-id');
}

// 物料库原生拖入（HTML5 drag，dataTransfer 带 materialId）
function onDrop(e: DragEvent): void {
  if (!isMaterialDrag(e)) return; // 非物料库拖入，交给 SortableJS
  const materialId = e.dataTransfer?.getData('application/x-material-id');
  if (!materialId) return;
  e.preventDefault();
  e.stopPropagation();
  dragOver.value = false;
  editor.addNode(materialId, undefined, props.parentId, props.slotName || undefined);
}

function onDragOver(e: DragEvent): void {
  if (!isMaterialDrag(e)) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  // dragover 持续触发时设 true（离开由 dragleave 处理）
  dragOver.value = true;
}

function onDragLeave(e: DragEvent): void {
  if (!isMaterialDrag(e)) return;
  // 仅当离开容器（relatedTarget 不在容器内）时才清除高亮
  const related = e.relatedTarget as Node | null;
  if (related && containerEl.value?.contains(related)) return;
  dragOver.value = false;
}
</script>

<template>
  <div
    ref="containerEl"
    class="container-list"
    :class="{ empty: children.length === 0, 'drop-active': dragOver }"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <NodeWrapper
      v-for="child in children"
      :key="child.id"
      :node="child"
      :readonly="readonly"
      :event-handler="eventHandler"
      :input-handler="inputHandler"
    />
    <div v-if="children.length === 0 && !readonly" class="drop-hint">
      {{ placeholder ?? '拖入组件' }}
    </div>
    <!-- 拖拽悬停时的实时提示（覆盖在容器上方） -->
    <div v-if="dragOver && !readonly" class="drop-overlay">
      <el-icon class="overlay-icon"><Plus /></el-icon>
      <span>松开以放入到此容器</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container-list {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 80px;
  padding: 4px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;

  &.drop-active {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    border-style: solid;
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  .drop-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: var(--color-text-4);
    pointer-events: none;
  }

  /* 拖拽悬停时的实时提示覆盖层 */
  .drop-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--color-primary);
    background: rgb(64 158 255 / 8%);
    border-radius: var(--radius-sm);
    pointer-events: none;

    .overlay-icon {
      font-size: 22px;
    }
  }
}
</style>
