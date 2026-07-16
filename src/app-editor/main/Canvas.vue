<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import draggable from 'vuedraggable';
import { useEditorStore } from '@/store/editorStore';
import NodeWrapper from './NodeWrapper.vue';
import { Plus } from '@element-plus/icons-vue';

const editor = useEditorStore();
const canvasRef = ref<HTMLElement>();

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

const dragOptions = {
  animation: 180,
  group: { name: 'canvas-nodes', pull: true, put: true },
  ghostClass: 'drag-ghost',
  chosenClass: 'drag-chosen',
  dragClass: 'drag-dragging',
};

/** vuedraggable 拖拽结束：提交一次历史用于撤销（跨列表时由源列表触发一次） */
function onDragEnd(): void {
  editor.commitSort();
}

/** 从左侧物料库拖入画布顶层（原生 HTML5 拖拽，与 vuedraggable 互不影响） */
function onDrop(e: DragEvent): void {
  const materialId = e.dataTransfer?.getData('application/x-material-id');
  if (!materialId) return; // 非物料库拖入（vuedraggable 排序），交给 vuedraggable 处理
  e.preventDefault();
  editor.addNode(materialId);
}

function onDragOver(e: DragEvent): void {
  // 仅在物料库拖入时放行（vuedraggable 拖拽时 dataTransfer 无此 key，但其自身会处理 dragover）
  if (!e.dataTransfer?.types.includes('application/x-material-id')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function clearSelect(): void {
  editor.selectNode(null);
}
</script>

<template>
  <div class="canvas-wrapper">
    <div
      ref="canvasRef"
      class="canvas-stage"
      @drop="onDrop"
      @dragover="onDragOver"
      @click="clearSelect"
    >
      <div class="canvas-page">
        <div v-if="editor.nodes.length === 0" class="canvas-empty" @drop="onDrop" @dragover="onDragOver">
          <el-icon class="empty-icon"><Plus /></el-icon>
          <p>将左侧组件拖入画布开始搭建</p>
          <p class="empty-sub">组件将按顺序自上而下排列</p>
        </div>

        <draggable
          v-else
          :list="editor.nodes"
          v-bind="dragOptions"
          item-key="id"
          class="flow-list"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <NodeWrapper :node="element" />
          </template>
        </draggable>
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
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 200px;
      }
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
