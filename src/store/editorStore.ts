import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { cloneDeep } from 'lodash-es';
import type { AppPage, ComponentNode, Variable, AppListItem } from '@/types';
import { materialRegistry } from '@/app-editor/material/registry';
import { genId } from '@/utils/common';

const MAX_HISTORY = 50;

export const useEditorStore = defineStore('editor', () => {
  // ===== 多页面：pages 为数据源，nodes/variables 为当前页的编辑态副本 =====
  const pages = ref<AppPage[]>([]);
  const activePageId = ref<string>('');
  const homePageId = ref<string>('');

  // 当前页的画布节点与变量（编辑态，切换页时同步回 pages）
  const nodes = ref<ComponentNode[]>([]);
  const variables = ref<Variable[]>([]);
  const selectedId = ref<string | null>(null);

  // 撤销/重做历史（仅针对当前页的 nodes 快照）
  const past = ref<ComponentNode[][]>([]);
  const future = ref<ComponentNode[][]>([]);

  const activePageIndex = computed(
    () => pages.value.findIndex((p) => p.id === activePageId.value),
  );

  const selectedNode = computed<ComponentNode | null>(
    () => nodes.value.find((n) => n.id === selectedId.value) ?? null,
  );

  /** 将当前编辑态（nodes/variables）写回 active page */
  function syncCurrentPage(): void {
    const idx = activePageIndex.value;
    if (idx < 0) return;
    pages.value[idx] = {
      ...pages.value[idx],
      components: cloneDeep(nodes.value),
      variables: cloneDeep(variables.value),
    };
  }

  /** 从应用数据加载全部页面，激活首页 */
  function loadFromApp(app: AppListItem): void {
    pages.value = cloneDeep(app.pages);
    homePageId.value = app.homePageId;
    activePageId.value = app.homePageId || pages.value[0]?.id || '';
    const active = pages.value.find((p) => p.id === activePageId.value);
    nodes.value = cloneDeep(active?.components ?? []);
    variables.value = cloneDeep(active?.variables ?? []);
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  /** 切换到指定页面（先同步当前页，再加载目标页） */
  function switchPage(pageId: string): void {
    if (pageId === activePageId.value) return;
    syncCurrentPage();
    const target = pages.value.find((p) => p.id === pageId);
    if (!target) return;
    activePageId.value = pageId;
    nodes.value = cloneDeep(target.components);
    variables.value = cloneDeep(target.variables);
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  /** 新建页面并切换过去 */
  function addPage(name?: string): string {
    syncCurrentPage();
    const page: AppPage = {
      id: genId(),
      name: name?.trim() || `页面${pages.value.length + 1}`,
      components: [],
      variables: [],
    };
    pages.value.push(page);
    activePageId.value = page.id;
    nodes.value = [];
    variables.value = [];
    selectedId.value = null;
    past.value = [];
    future.value = [];
    return page.id;
  }

  /** 重命名页面 */
  function renamePage(pageId: string, name: string): void {
    const page = pages.value.find((p) => p.id === pageId);
    if (page) page.name = name.trim() || page.name;
  }

  /** 删除页面（至少保留 1 个；若删的是当前页则切换到相邻页） */
  function removePage(pageId: string): void {
    if (pages.value.length <= 1) return;
    const idx = pages.value.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    pages.value.splice(idx, 1);
    if (homePageId.value === pageId) {
      homePageId.value = pages.value[0].id;
    }
    if (activePageId.value === pageId) {
      const next = pages.value[Math.min(idx, pages.value.length - 1)];
      switchPage(next.id);
    }
  }

  /** 设为首页 */
  function setHomePage(pageId: string): void {
    if (pages.value.some((p) => p.id === pageId)) homePageId.value = pageId;
  }

  /** 提交一次画布变更到历史 */
  function commit(): void {
    past.value.push(cloneDeep(nodes.value));
    if (past.value.length > MAX_HISTORY) past.value.shift();
    future.value = [];
  }

  /** 新增组件到列表末尾（或指定索引） */
  function addNode(materialId: string, index?: number): ComponentNode | null {
    const meta = materialRegistry[materialId];
    if (!meta) return null;
    commit();
    const node: ComponentNode = {
      id: genId(),
      componentId: materialId,
      name: meta.name,
      props: cloneDeep(meta.defaultProps),
      style: {},
      size: { ...meta.defaultSize },
      children: [],
      events: [],
    };
    if (typeof index === 'number') nodes.value.splice(index, 0, node);
    else nodes.value.push(node);
    selectedId.value = node.id;
    return node;
  }

  function selectNode(id: string | null): void {
    selectedId.value = id;
  }

  function removeNode(id: string): void {
    commit();
    nodes.value = nodes.value.filter((n) => n.id !== id);
    if (selectedId.value === id) selectedId.value = null;
  }

  /** 复制节点到其后方 */
  function duplicateNode(id: string): void {
    const node = nodes.value.find((n) => n.id === id);
    if (!node) return;
    commit();
    const copy: ComponentNode = cloneDeep(node);
    copy.id = genId();
    const idx = nodes.value.findIndex((n) => n.id === id);
    nodes.value.splice(idx + 1, 0, copy);
    selectedId.value = copy.id;
  }

  /** 上移一位 */
  function moveUp(id: string): void {
    const idx = nodes.value.findIndex((n) => n.id === id);
    if (idx <= 0) return;
    commit();
    const arr = nodes.value;
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
  }

  /** 下移一位 */
  function moveDown(id: string): void {
    const idx = nodes.value.findIndex((n) => n.id === id);
    if (idx < 0 || idx >= nodes.value.length - 1) return;
    commit();
    const arr = nodes.value;
    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
  }

  /** 拖拽排序后整体提交（vuedraggable 已直接修改数组，这里仅入栈历史） */
  function commitSort(): void {
    commit();
  }

  function updateNode(id: string, patch: Partial<ComponentNode>): void {
    const node = nodes.value.find((n) => n.id === id);
    if (node) Object.assign(node, patch);
  }

  function updateProps(id: string, key: string, value: unknown): void {
    const node = nodes.value.find((n) => n.id === id);
    if (node) node.props[key] = value;
  }

  function updateStyle(id: string, key: string, value: string): void {
    const node = nodes.value.find((n) => n.id === id);
    if (node) node.style[key] = value;
  }

  /** 实时更新尺寸（拖拽过程中调用，不入历史） */
  function updateSize(id: string, size: { width: number; height: number }): void {
    const node = nodes.value.find((n) => n.id === id);
    if (node) node.size = size;
  }

  // 拉伸历史：开始时快照，结束时比对后入栈
  let resizeSnapshot: ComponentNode[] | null = null;
  function beginResize(): void {
    resizeSnapshot = cloneDeep(nodes.value);
  }
  function endResize(): void {
    if (resizeSnapshot && JSON.stringify(resizeSnapshot) !== JSON.stringify(nodes.value)) {
      past.value.push(resizeSnapshot);
      if (past.value.length > MAX_HISTORY) past.value.shift();
      future.value = [];
    }
    resizeSnapshot = null;
  }

  function updateEvents(id: string, events: ComponentNode['events']): void {
    commit();
    const node = nodes.value.find((n) => n.id === id);
    if (node) node.events = events ? cloneDeep(events) : [];
  }

  // ===== 变量管理（作用于当前页） =====
  function addVariable(): Variable {
    const v: Variable = {
      id: genId(),
      name: `variable_${variables.value.length + 1}`,
      type: 'string',
      defaultValue: '',
    };
    variables.value.push(v);
    return v;
  }

  function updateVariable(id: string, patch: Partial<Variable>): void {
    const v = variables.value.find((it) => it.id === id);
    if (v) Object.assign(v, patch);
  }

  function removeVariable(id: string): void {
    variables.value = variables.value.filter((it) => it.id !== id);
  }

  function undo(): void {
    const snap = past.value.pop();
    if (!snap) return;
    future.value.push(cloneDeep(nodes.value));
    nodes.value = snap;
    selectedId.value = null;
  }

  function redo(): void {
    const snap = future.value.pop();
    if (!snap) return;
    past.value.push(cloneDeep(nodes.value));
    nodes.value = snap;
    selectedId.value = null;
  }

  const canUndo = computed(() => past.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  /** 导出全部页面数据（保存前会同步当前页） */
  function toAppData(): { pages: AppPage[]; homePageId: string } {
    syncCurrentPage();
    return {
      pages: cloneDeep(pages.value),
      homePageId: homePageId.value,
    };
  }

  return {
    // 多页面状态
    pages,
    activePageId,
    homePageId,
    activePageIndex,
    loadFromApp,
    switchPage,
    addPage,
    renamePage,
    removePage,
    setHomePage,
    // 当前页编辑态
    nodes,
    variables,
    selectedId,
    selectedNode,
    canUndo,
    canRedo,
    addNode,
    selectNode,
    removeNode,
    duplicateNode,
    moveUp,
    moveDown,
    commitSort,
    updateNode,
    updateProps,
    updateStyle,
    updateSize,
    beginResize,
    endResize,
    updateEvents,
    addVariable,
    updateVariable,
    removeVariable,
    undo,
    redo,
    toAppData,
  };
});
