import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { cloneDeep } from 'lodash-es';
import type {
  AppPage,
  ComponentNode,
  Variable,
  AppListItem,
  DataTableConfig,
  DataTableColumn,
  WorkflowConfig,
} from '@/types';
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

  // ===== 交互逻辑：全局变量 / 数据表 / 工作流 =====
  const globalVariables = ref<Variable[]>([]);
  const dataTables = ref<DataTableConfig[]>([]);
  const workflows = ref<WorkflowConfig[]>([]);

  // 撤销/重做历史（仅针对当前页的 nodes 快照）
  const past = ref<ComponentNode[][]>([]);
  const future = ref<ComponentNode[][]>([]);

  const activePageIndex = computed(
    () => pages.value.findIndex((p) => p.id === activePageId.value),
  );

  // ===== 递归查找（支持容器嵌套 + 命名 slot） =====
  /** 按 id 递归查找节点（默认从当前页顶层 nodes 查起，搜索 children 和 slots） */
  function findNodeById(id: string, list: ComponentNode[] = nodes.value): ComponentNode | null {
    for (const n of list) {
      if (n.id === id) return n;
      const found = findNodeById(id, n.children);
      if (found) return found;
      // 搜索命名 slot
      if (n.slots) {
        for (const slotChildren of Object.values(n.slots)) {
          const slotFound = findNodeById(id, slotChildren);
          if (slotFound) return slotFound;
        }
      }
    }
    return null;
  }

  /** 查找节点所在的位置：所属数组 + 索引 + 父节点（顶层时 parent=null，搜索 children 和 slots） */
  function findNodeLocation(
    id: string,
    list: ComponentNode[] = nodes.value,
    parent: ComponentNode | null = null,
  ): { list: ComponentNode[]; index: number; parent: ComponentNode | null } | null {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { list, index: i, parent };
      const childLoc = findNodeLocation(id, list[i].children, list[i]);
      if (childLoc) return childLoc;
      // 搜索命名 slot（用局部变量避免 TS 类型收窄失败）
      const slots = list[i].slots;
      if (slots) {
        for (const slotChildren of Object.values(slots)) {
          const slotLoc = findNodeLocation(id, slotChildren, list[i]);
          if (slotLoc) return slotLoc;
        }
      }
    }
    return null;
  }

  /** 确保节点的 slots 字段存在且包含指定的 slot 名称（面板数量变化时同步增删） */
  function ensureSlots(nodeId: string, slotNames: string[]): void {
    const node = findNodeById(nodeId);
    if (!node) return;
    if (!node.slots) node.slots = {};
    // 添加新 slot
    for (const name of slotNames) {
      if (!node.slots[name]) node.slots[name] = [];
    }
    // 删除旧 slot（面板数量减少时）
    for (const oldName of Object.keys(node.slots)) {
      if (!slotNames.includes(oldName)) delete node.slots[oldName];
    }
  }

  const selectedNode = computed<ComponentNode | null>(
    () => (selectedId.value ? findNodeById(selectedId.value) : null),
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
    // 交互逻辑数据
    globalVariables.value = cloneDeep(app.globalVariables ?? []);
    dataTables.value = cloneDeep(app.dataTables ?? []);
    workflows.value = cloneDeep(app.workflows ?? []);
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

  /** 新增组件：parentId+slotName 存在时挂到该容器的命名 slot，parentId 存在时挂到 children，否则加到顶层 */
  function addNode(
    materialId: string,
    index?: number,
    parentId?: string,
    slotName?: string,
  ): ComponentNode | null {
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
    if (parentId) {
      const parent = findNodeById(parentId);
      if (parent) {
        // 有 slotName：加到命名 slot
        if (slotName) {
          if (!parent.slots) parent.slots = {};
          if (!parent.slots[slotName]) parent.slots[slotName] = [];
          if (typeof index === 'number') parent.slots[slotName].splice(index, 0, node);
          else parent.slots[slotName].push(node);
        } else {
          // 无 slotName：加到默认 children
          if (typeof index === 'number') parent.children.splice(index, 0, node);
          else parent.children.push(node);
        }
      }
    } else {
      if (typeof index === 'number') nodes.value.splice(index, 0, node);
      else nodes.value.push(node);
    }
    selectedId.value = node.id;
    return node;
  }

  function selectNode(id: string | null): void {
    selectedId.value = id;
  }

  function removeNode(id: string): void {
    const loc = findNodeLocation(id);
    if (!loc) return;
    commit();
    loc.list.splice(loc.index, 1);
    if (selectedId.value === id) selectedId.value = null;
  }

  /** 复制节点到其后方（同一层级） */
  function duplicateNode(id: string): void {
    const loc = findNodeLocation(id);
    if (!loc) return;
    commit();
    const copy: ComponentNode = cloneDeep(loc.list[loc.index]);
    copy.id = genId();
    loc.list.splice(loc.index + 1, 0, copy);
    selectedId.value = copy.id;
  }

  /** 上移一位（在同一层级内） */
  function moveUp(id: string): void {
    const loc = findNodeLocation(id);
    if (!loc || loc.index <= 0) return;
    commit();
    const arr = loc.list;
    [arr[loc.index - 1], arr[loc.index]] = [arr[loc.index], arr[loc.index - 1]];
  }

  /** 下移一位（在同一层级内） */
  function moveDown(id: string): void {
    const loc = findNodeLocation(id);
    if (!loc || loc.index >= loc.list.length - 1) return;
    commit();
    const arr = loc.list;
    [arr[loc.index + 1], arr[loc.index]] = [arr[loc.index], arr[loc.index + 1]];
  }

  /** 拖拽排序后整体提交（vuedraggable 已直接修改数组，这里仅入栈历史） */
  function commitSort(): void {
    commit();
  }

  /** 清空当前画布所有节点（入历史，支持撤销） */
  function clearCanvas(): void {
    commit();
    nodes.value = [];
    selectedId.value = null;
  }

  function updateNode(id: string, patch: Partial<ComponentNode>): void {
    const node = findNodeById(id);
    if (node) Object.assign(node, patch);
  }

  function updateProps(id: string, key: string, value: unknown): void {
    const node = findNodeById(id);
    if (node) node.props[key] = value;
  }

  function updateStyle(id: string, key: string, value: string): void {
    const node = findNodeById(id);
    if (node) node.style[key] = value;
  }

  /** 实时更新尺寸（拖拽过程中调用，不入历史） */
  function updateSize(id: string, size: { width: number; height: number }): void {
    const node = findNodeById(id);
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
    const node = findNodeById(id);
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

  // ===== 全局变量管理（交互逻辑，跨页面共享） =====
  function addGlobalVariable(): Variable {
    const v: Variable = {
      id: genId(),
      name: `global_${globalVariables.value.length + 1}`,
      type: 'string',
      defaultValue: '',
    };
    globalVariables.value.push(v);
    return v;
  }

  function updateGlobalVariable(id: string, patch: Partial<Variable>): void {
    const v = globalVariables.value.find((it) => it.id === id);
    if (v) Object.assign(v, patch);
  }

  function removeGlobalVariable(id: string): void {
    globalVariables.value = globalVariables.value.filter((it) => it.id !== id);
  }

  // ===== 数据表管理（交互逻辑，本地缓存） =====
  function addDataTable(name?: string): DataTableConfig {
    const table: DataTableConfig = {
      id: genId(),
      name: name?.trim() || `数据表${dataTables.value.length + 1}`,
      columns: [{ id: genId(), name: 'id', type: 'string' }],
      rows: [],
    };
    dataTables.value.push(table);
    return table;
  }

  function updateDataTable(id: string, patch: Partial<DataTableConfig>): void {
    const t = dataTables.value.find((it) => it.id === id);
    if (t) Object.assign(t, patch);
  }

  function removeDataTable(id: string): void {
    dataTables.value = dataTables.value.filter((it) => it.id !== id);
  }

  /** 给数据表新增列 */
  function addTableColumn(tableId: string, name?: string, type?: DataTableColumn['type']): void {
    const t = dataTables.value.find((it) => it.id === tableId);
    if (!t) return;
    const col: DataTableColumn = {
      id: genId(),
      name: name?.trim() || `field_${t.columns.length + 1}`,
      type: type ?? 'string',
    };
    t.columns.push(col);
    // 已有行补默认值
    for (const row of t.rows) {
      row[col.id] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : '';
    }
  }

  /** 更新列定义（改名/改类型时同步更新行数据） */
  function updateTableColumn(
    tableId: string,
    colId: string,
    patch: Partial<DataTableColumn>,
  ): void {
    const t = dataTables.value.find((it) => it.id === tableId);
    if (!t) return;
    const col = t.columns.find((c) => c.id === colId);
    if (!col) return;
    const oldType = col.type;
    Object.assign(col, patch);
    // 类型变更时转换已有数据
    if (patch.type && patch.type !== oldType) {
      for (const row of t.rows) {
        const raw = row[colId];
        if (patch.type === 'number') row[colId] = Number(raw) || 0;
        else if (patch.type === 'boolean') row[colId] = raw === 'true' || raw === true;
        else row[colId] = String(raw ?? '');
      }
    }
  }

  /** 删除列（同步删除行中对应字段） */
  function removeTableColumn(tableId: string, colId: string): void {
    const t = dataTables.value.find((it) => it.id === tableId);
    if (!t) return;
    t.columns = t.columns.filter((c) => c.id !== colId);
    for (const row of t.rows) {
      delete row[colId];
    }
  }

  /** 新增空数据行 */
  function addTableRow(tableId: string): void {
    const t = dataTables.value.find((it) => it.id === tableId);
    if (!t) return;
    const row: Record<string, string | number | boolean> = {};
    for (const col of t.columns) {
      row[col.id] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : '';
    }
    t.rows.push(row);
  }

  /** 更新行中某单元格的值 */
  function updateTableCell(
    tableId: string,
    rowIndex: number,
    colId: string,
    value: string | number | boolean,
  ): void {
    const t = dataTables.value.find((it) => it.id === tableId);
    if (!t || !t.rows[rowIndex]) return;
    t.rows[rowIndex][colId] = value;
  }

  /** 删除行 */
  function removeTableRow(tableId: string, rowIndex: number): void {
    const t = dataTables.value.find((it) => it.id === tableId);
    if (!t) return;
    t.rows.splice(rowIndex, 1);
  }

  // ===== 工作流管理（交互逻辑，当前仅展示标题） =====
  function addWorkflow(name?: string, description?: string): WorkflowConfig {
    const wf: WorkflowConfig = {
      id: genId(),
      name: name?.trim() || `工作流${workflows.value.length + 1}`,
      description: description ?? '',
      inputParams: '',
    };
    workflows.value.push(wf);
    return wf;
  }

  function updateWorkflow(id: string, patch: Partial<WorkflowConfig>): void {
    const wf = workflows.value.find((it) => it.id === id);
    if (wf) Object.assign(wf, patch);
  }

  function removeWorkflow(id: string): void {
    workflows.value = workflows.value.filter((it) => it.id !== id);
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

  /** 导出全部应用数据（保存前会同步当前页） */
  function toAppData(): {
    pages: AppPage[];
    homePageId: string;
    globalVariables: Variable[];
    dataTables: DataTableConfig[];
    workflows: WorkflowConfig[];
  } {
    syncCurrentPage();
    return {
      pages: cloneDeep(pages.value),
      homePageId: homePageId.value,
      globalVariables: cloneDeep(globalVariables.value),
      dataTables: cloneDeep(dataTables.value),
      workflows: cloneDeep(workflows.value),
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
    ensureSlots,
    selectNode,
    removeNode,
    duplicateNode,
    moveUp,
    moveDown,
    commitSort,
    clearCanvas,
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
    // 交互逻辑：全局变量
    globalVariables,
    addGlobalVariable,
    updateGlobalVariable,
    removeGlobalVariable,
    // 交互逻辑：数据表
    dataTables,
    addDataTable,
    updateDataTable,
    removeDataTable,
    addTableColumn,
    updateTableColumn,
    removeTableColumn,
    addTableRow,
    updateTableCell,
    removeTableRow,
    // 交互逻辑：工作流
    workflows,
    addWorkflow,
    updateWorkflow,
    removeWorkflow,
    undo,
    redo,
    toAppData,
  };
});
