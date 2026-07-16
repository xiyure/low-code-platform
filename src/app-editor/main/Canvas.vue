<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import draggable from 'vuedraggable';
import { useEditorStore } from '@/store/editorStore';
import ComponentRenderer from '@/app-editor/material/ComponentRenderer.vue';
import { Delete, CopyDocument, Top, Bottom, Plus } from '@element-plus/icons-vue';

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

/** 列表绑定（vuedraggable 直接操作 store 的 nodes） */
const dragList = computed({
  get: () => editor.nodes,
  set: (val) => {
    editor.nodes.splice(0, editor.nodes.length, ...val);
  },
});

const dragOptions = {
  animation: 180,
  group: 'canvas',
  disabled: false,
  ghostClass: 'drag-ghost',
  chosenClass: 'drag-chosen',
  dragClass: 'drag-dragging',
};

/** 拖拽结束：提交一次历史用于撤销 */
function onEnd(): void {
  editor.commitSort();
}

/** 从左侧组件库拖入画布 */
function onDrop(e: DragEvent): void {
  e.preventDefault();
  const materialId = e.dataTransfer?.getData('application/x-material-id');
  if (!materialId) return;
  editor.addNode(materialId);
}

function onDragOver(e: DragEvent): void {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}

function selectNode(id: string, e: MouseEvent): void {
  e.stopPropagation();
  editor.selectNode(id);
}

function clearSelect(): void {
  editor.selectNode(null);
}

// ===== 尺寸拉伸（流式布局：右/e 改宽，下/s 改高，右下/se 同改） =====
const MIN_W = 80;
const MIN_H = 32;

let resizingId = '';
let resizingDir = '';
let startX = 0;
let startY = 0;
let startW = 0;
let startH = 0;
let resized = false;

function onResizeStart(e: PointerEvent, id: string, dir: string, w: number, h: number): void {
  if (e.button !== 0) return;
  e.stopPropagation();
  e.preventDefault();
  resizingId = id;
  resizingDir = dir;
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
  if (!resizingId) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) resized = true;
  let w = startW;
  let h = startH;
  if (resizingDir.includes('e')) w = Math.max(MIN_W, startW + dx);
  if (resizingDir.includes('s')) h = Math.max(MIN_H, startH + dy);
  editor.updateSize(resizingId, { width: w, height: h });
}

function onResizeEnd(): void {
  if (resizingId && resized) editor.endResize();
  resizingId = '';
  resizingDir = '';
  resized = false;
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);
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
        <div v-if="editor.nodes.length === 0" class="canvas-empty">
          <el-icon class="empty-icon"><Plus /></el-icon>
          <p>将左侧组件拖入画布开始搭建</p>
          <p class="empty-sub">组件将按顺序自上而下排列</p>
        </div>

        <draggable
          v-else
          v-model="dragList"
          v-bind="dragOptions"
          item-key="id"
          handle=".flow-node"
          class="flow-list"
          @end="onEnd"
        >
          <template #item="{ element }">
            <div
              class="flow-node"
              :class="{ selected: editor.selectedId === element.id }"
              :style="{ width: element.size.width + 'px' }"
              @click="(e) => selectNode(element.id, e)"
            >
              <ComponentRenderer :node="element" />

              <div v-if="editor.selectedId === element.id" class="node-toolbar" @click.stop>
                <el-button class="tool-btn" text size="small" title="上移" @click="editor.moveUp(element.id)">
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button class="tool-btn" text size="small" title="下移" @click="editor.moveDown(element.id)">
                  <el-icon><Bottom /></el-icon>
                </el-button>
                <el-button class="tool-btn" text size="small" title="复制" @click="editor.duplicateNode(element.id)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button class="tool-btn danger" text size="small" title="删除" @click="editor.removeNode(element.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>

              <!-- 拉伸手柄：选中时显示，仅右下角 -->
              <span
                v-if="editor.selectedId === element.id"
                class="resize-handle rh-se"
                @pointerdown="
                  (e) => onResizeStart(e, element.id, 'se', element.size.width, element.size.height)
                "
              ></span>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  flex: 1;
  overflow: auto;
  background: var(--color-bg-2);
}

.canvas-stage {
  display: flex;
  justify-content: center;
  min-height: 100%;
  padding: 32px 24px;
}

.canvas-page {
  width: 100%;
  max-width: 720px;
  min-height: 600px;
  padding: 24px;
  background: var(--color-bg-1);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 480px;
  color: var(--color-text-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.empty-icon {
  margin-bottom: 8px;
  font-size: 40px;
}

.empty-sub {
  margin-top: 4px;
  font-size: 12px;
}

.flow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.flow-node {
  position: relative;
  cursor: move;
  background: var(--color-bg-1);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.flow-node:hover {
  border-color: var(--color-primary);
}

.flow-node.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.node-toolbar {
  position: absolute;
  top: -36px;
  right: 0;
  z-index: 10;
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

.tool-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  color: var(--color-text-2);
  transition:
    background 0.15s,
    color 0.15s;
}

.tool-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.tool-btn.danger:hover {
  color: var(--color-danger);
  background: rgb(245 63 63 / 10%);
}

/* 拉伸手柄（仅右下角） */
.resize-handle {
  position: absolute;
  z-index: 11;
  background: var(--color-primary);
  border: 2px solid var(--color-bg-1);
  border-radius: 3px;
}

.rh-se {
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.drag-ghost {
  opacity: 0.4;
}

.drag-chosen {
  border-color: var(--color-primary) !important;
}
</style>
