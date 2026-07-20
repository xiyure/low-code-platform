<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useDraggable } from 'vue-draggable-plus';
import { useEditorStore } from '@/store/editorStore';
import NodeWrapper from './NodeWrapper.vue';
import AlignGuides from './AlignGuides.vue';
import { Plus } from '@element-plus/icons-vue';

const editor = useEditorStore();
// storeToRefs 返回可写 ref，useDraggable 直接操作该 ref 实现排序
const { nodes } = storeToRefs(editor);
const canvasRef = ref<HTMLElement>();
const flowListRef = ref<HTMLElement>();
const alignGuidesRef = shallowRef<InstanceType<typeof AlignGuides> | null>(null);

/** 插入位置指示：dragover 时根据鼠标位置计算插入 index，显示指示线 */
const insertIndex = ref(-1);

/** 退格键删除选中组件（输入框聚焦时不触发） */
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Backspace') return;
  const target = e.target as HTMLElement;
  const tag = target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
  if (!editor.selectedId) return;
  e.preventDefault();
  editor.removeNode(editor.selectedId);
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

/** 计算鼠标位置对应的插入 index（用于物料库拖入和排序时显示指示线） */
function calcInsertIndex(mouseY: number): number {
  const flowList = flowListRef.value;
  if (!flowList) return -1;
  // 仅统计直接子节点（NodeWrapper），排除插入指示线本身
  const children = Array.from(flowList.children).filter(
    (el) => !el.classList.contains('insert-indicator'),
  ) as HTMLElement[];
  if (children.length === 0) return 0;
  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    if (mouseY < rect.top + rect.height / 2) return i;
  }
  return children.length;
}

// useDraggable composable 初始化 SortableJS
useDraggable(flowListRef, nodes, {
  animation: 180,
  group: { name: 'canvas-nodes', pull: true, put: true },
  ghostClass: 'drag-ghost',
  chosenClass: 'drag-chosen',
  dragClass: 'drag-dragging',
  swapThreshold: 0.65,
  emptyInsertThreshold: 80,
  onStart: () => {
    alignGuidesRef.value?.start();
    insertIndex.value = -1; // 排序拖拽由 SortableJS 的 ghost 元素指示，不显示自定义指示线
  },
  onChange: () => {
    // 排序过程中 SortableJS 会移动 ghost 元素，插入位置由 ghost 可视化
    insertIndex.value = -1;
  },
  onEnd: () => {
    alignGuidesRef.value?.stop();
    editor.commitSort();
    insertIndex.value = -1;
  },
});

/** 从左侧物料库拖入画布顶层（原生 HTML5 拖拽，根据鼠标位置计算插入 index） */
function onDrop(e: DragEvent): void {
  const materialId = e.dataTransfer?.getData('application/x-material-id');
  if (!materialId) return; // 非物料库拖入（SortableJS 排序），交给 useDraggable 处理
  e.preventDefault();

  const index = calcInsertIndex(e.clientY);
  if (index < 0) {
    editor.addNode(materialId);
  } else {
    editor.addNode(materialId, index);
  }
  insertIndex.value = -1;
}

function onDragOver(e: DragEvent): void {
  // 仅在物料库拖入时处理（SortableJS 拖拽时 dataTransfer 无此 key）
  if (!e.dataTransfer?.types.includes('application/x-material-id')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  insertIndex.value = calcInsertIndex(e.clientY);
}

function onDragLeave(e: DragEvent): void {
  // 仅当离开 flowList 容器时才清除指示
  const related = e.relatedTarget as Node | null;
  if (related && flowListRef.value?.contains(related)) return;
  insertIndex.value = -1;
}

function clearSelect(): void {
  editor.selectNode(null);
}

/** 提供给 AlignGuides 的画布容器获取函数 */
function getCanvasStage(): HTMLElement | undefined {
  // canvas-page 才是节点容器（相对它定位辅助线）
  return canvasRef.value?.querySelector<HTMLElement>('.canvas-page') ?? canvasRef.value;
}
</script>

<template>
  <div class="canvas-wrapper">
    <div
      ref="canvasRef"
      class="canvas-stage"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @click="clearSelect"
    >
      <div class="canvas-page">
        <AlignGuides ref="alignGuidesRef" :container-ref="getCanvasStage" />

        <!-- 始终渲染 flow-list，避免初始化时 flowListRef 为 undefined 导致 SortableJS 报错 -->
        <div ref="flowListRef" class="flow-list">
          <!-- 插入位置指示线：物料库拖入时根据鼠标位置显示 -->
          <div v-if="insertIndex === 0" class="insert-indicator insert-before" />
          <template v-for="(node, i) in nodes" :key="node.id">
            <NodeWrapper :node="node" />
            <div v-if="insertIndex === i + 1" class="insert-indicator insert-after" />
          </template>
          <div v-if="nodes.length === 0 && insertIndex < 0" class="canvas-empty" @drop="onDrop" @dragover="onDragOver">
            <el-icon class="empty-icon"><Plus /></el-icon>
            <p>将左侧组件拖入画布开始搭建</p>
            <p class="empty-sub">组件将按顺序自上而下排列</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.canvas-wrapper {
  flex: 1;
  overflow: auto;
  background: var(--color-bg-2);

  .canvas-stage {
    display: flex;
    justify-content: center;
    min-height: 100%;
    padding: 32px 24px;

    .canvas-page {
      position: relative;
      width: 100%;
      max-width: 720px;
      min-height: 600px;
      padding: 24px;
      background: var(--color-bg-1);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);

      .canvas-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 480px;
        color: var(--color-text-4);
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-md);

        .empty-icon {
          margin-bottom: 8px;
          font-size: 40px;
        }

        .empty-sub {
          margin-top: 4px;
          font-size: 12px;
        }
      }

      .flow-list {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 200px;
      }
    }
  }
}

/* 拖拽排序时的占位符样式（SortableJS ghostClass） */
.drag-ghost {
  opacity: 0.4;
}

.drag-chosen {
  border-color: var(--color-primary) !important;
}

/* 物料库拖入时的插入位置指示线 */
.insert-indicator {
  position: relative;
  height: 2px;
  margin: -1px 0;
  background: var(--color-primary);
  border-radius: 1px;
  box-shadow: 0 0 4px rgb(64 158 255 / 50%);
  pointer-events: none;

  &::before {
    position: absolute;
    top: 50%;
    left: -3px;
    width: 8px;
    height: 8px;
    content: '';
    background: var(--color-primary);
    border-radius: 50%;
    transform: translateY(-50%);
  }

  &::after {
    position: absolute;
    top: 50%;
    right: -3px;
    width: 8px;
    height: 8px;
    content: '';
    background: var(--color-primary);
    border-radius: 50%;
    transform: translateY(-50%);
  }
}
</style>
