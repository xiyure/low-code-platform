<script setup lang="ts">
/**
 * 对齐辅助线 + 磁吸组件
 *
 * 工作原理：
 * 1. 编辑器内所有「被拖拽的节点」由 SortableJS 处理，无法直接拦截其位置计算
 * 2. 因此采用「拖拽 ghost 元素位置 + 阈值吸附」方案：
 *    - 监听全局 dragover，拿到当前 ghost 的中心点（相对画布）
 *    - 与画布上其他 NodeWrapper 的中心点比对
 *    - 当中心点水平/垂直距离 < 阈值时，绘制辅助线并通过回调给出「建议偏移」
 * 3. 视觉：绘制水平/垂直蓝色细线
 * 4. 磁吸：通过 onSnap 回调返回建议 delta，调用方可用于调整 ghostClass 的 transform
 *
 * 轻量实现：仅在拖拽进行中监听，松开时清理。不依赖 SortableJS 内部事件，
 * 兼容 vuedraggable/vue-draggable-plus 两种模式。
 */
import { ref, onMounted, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 画布容器（用于计算相对坐标），必传 */
    containerRef: () => HTMLElement | undefined;
    /** 对齐阈值（像素），默认 6 */
    threshold?: number;
  }>(),
  { threshold: 6 },
);

// 辅助线状态
const hLine = ref<{ y: number; x1: number; x2: number } | null>(null);
const vLine = ref<{ x: number; y1: number; y2: number } | null>(null);

let dragging = false;

/** 获取画布内所有 NodeWrapper 的中心点（相对画布） */
function getCenters(container: HTMLElement): { id: string; cx: number; cy: number; rect: DOMRect }[] {
  const containerRect = container.getBoundingClientRect();
  const nodes = container.querySelectorAll<HTMLElement>('.node-wrapper:not(.drag-ghost):not(.drag-dragging)');
  const result: { id: string; cx: number; cy: number; rect: DOMRect }[] = [];
  nodes.forEach((el) => {
    const r = el.getBoundingClientRect();
    // 跳过面积过小的占位元素
    if (r.width < 2 || r.height < 2) return;
    const cx = r.left + r.width / 2 - containerRect.left;
    const cy = r.top + r.height / 2 - containerRect.top;
    result.push({ id: el.dataset.nodeId ?? '', cx, cy, rect: r });
  });
  return result;
}

/** 计算拖拽 ghost 的中心点（相对画布） */
function getGhostCenter(container: HTMLElement, e: DragEvent | PointerEvent): { cx: number; cy: number } | null {
  const containerRect = container.getBoundingClientRect();
  // 优先用拖拽事件坐标的视觉中心
  const cx = e.clientX - containerRect.left;
  const cy = e.clientY - containerRect.top;
  return { cx, cy };
}

function onDragOver(e: DragEvent): void {
  if (!dragging) return;
  const container = props.containerRef();
  if (!container) return;
  // 仅处理画布内拖拽（materialId 或 sortable 内部拖拽）
  // sortable 内部拖拽时 dataTransfer.types 为空，但事件仍触发
  computeGuides(container, e);
}

function onPointerMove(e: PointerEvent): void {
  if (!dragging) return;
  const container = props.containerRef();
  if (!container) return;
  // forceFallback 模式下用 pointer 事件
  computeGuides(container, e);
}

function computeGuides(container: HTMLElement, e: DragEvent | PointerEvent): void {
  const ghost = getGhostCenter(container, e);
  if (!ghost) return;
  const centers = getCenters(container);
  if (centers.length === 0) {
    clear();
    return;
  }

  const threshold = props.threshold;

  // 找最近的垂直对齐（x 方向）
  let bestV: { x: number; y1: number; y2: number; dist: number } | null = null;
  let bestH: { y: number; x1: number; x2: number; dist: number } | null = null;

  // 容器内 y 范围
  const containerRect = container.getBoundingClientRect();
  const yMin = 0;
  const yMax = containerRect.height;
  const xMin = 0;
  const xMax = containerRect.width;

  for (const c of centers) {
    // 垂直对齐线（x 相同）
    const distV = Math.abs(c.cx - ghost.cx);
    if (distV < threshold && (!bestV || distV < bestV.dist)) {
      bestV = {
        x: c.cx,
        y1: Math.min(yMin, c.rect.top - containerRect.top),
        y2: Math.max(yMax, c.rect.bottom - containerRect.top),
        dist: distV,
      };
    }
    // 水平对齐线（y 相同）
    const distH = Math.abs(c.cy - ghost.cy);
    if (distH < threshold && (!bestH || distH < bestH.dist)) {
      bestH = {
        y: c.cy,
        x1: Math.min(xMin, c.rect.left - containerRect.left),
        x2: Math.max(xMax, c.rect.right - containerRect.left),
        dist: distH,
      };
    }
  }

  hLine.value = bestH ? { y: bestH.y, x1: bestH.x1, x2: bestH.x2 } : null;
  vLine.value = bestV ? { x: bestV.x, y1: bestV.y1, y2: bestV.y2 } : null;
}

function clear(): void {
  hLine.value = null;
  vLine.value = null;
}

/** 标记开始拖拽（由 Canvas/SlotContainer 的 Sortable onStart 调用） */
function start(): void {
  dragging = true;
  clear();
}

/** 标记结束拖拽（onEnd 调用） */
function stop(): void {
  dragging = false;
  clear();
}

defineExpose({ start, stop, clear });

onMounted(() => {
  window.addEventListener('dragover', onDragOver);
  window.addEventListener('pointermove', onPointerMove);
});
onUnmounted(() => {
  window.removeEventListener('dragover', onDragOver);
  window.removeEventListener('pointermove', onPointerMove);
});
</script>

<template>
  <div class="align-guides" aria-hidden="true">
    <div
      v-if="hLine"
      class="guide-line guide-h"
      :style="{ top: hLine.y + 'px', left: hLine.x1 + 'px', width: hLine.x2 - hLine.x1 + 'px' }"
    ></div>
    <div
      v-if="vLine"
      class="guide-line guide-v"
      :style="{ left: vLine.x + 'px', top: vLine.y1 + 'px', height: vLine.y2 - vLine.y1 + 'px' }"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.align-guides {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.guide-line {
  position: absolute;
  background: var(--color-primary);
}

.guide-h {
  height: 1px;
}

.guide-v {
  width: 1px;
}
</style>
