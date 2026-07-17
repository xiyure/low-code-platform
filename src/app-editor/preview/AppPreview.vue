<script setup lang="ts">
import { onMounted, ref, reactive, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spaceApi } from '@/space/infrastructure/spaceApi';
import NodeWrapper from '@/app-editor/main/NodeWrapper.vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, HomeFilled } from '@element-plus/icons-vue';
import type { AppListItem, AppPage, ComponentNode, ComponentEvent, EventActionConfig } from '@/types';
import { resolveTemplate, resolveValue, buildInitialValues } from '@/utils/common';

const route = useRoute();
const router = useRouter();
const app = ref<AppListItem | null>(null);
/** 当前预览的页面 id（默认首页） */
const activePageId = ref<string>('');
/**
 * 每页的运行时状态（页面切换时各自独立保留）
 * 用 reactive 让 varValues/inputValues 的属性赋值能被 computed 捕获，
 * 实现 setVariable 后依赖该变量的组件自动重渲染。
 */
interface PageState {
  varValues: Record<string, string | number | boolean>;
  inputValues: Record<string, string>;
  hiddenIds: Set<string>;
}
const pageStates = reactive<Record<string, PageState>>({});

onMounted(async () => {
  const data = await spaceApi.getApp(route.params.appId as string);
  if (!data) {
    ElMessage.error('应用不存在');
    router.back();
    return;
  }
  app.value = JSON.parse(JSON.stringify(data));
  activePageId.value = data.homePageId || data.pages[0]?.id || '';
  ensurePageState(activePageId.value);
  // 首屏渲染后触发所有节点的 load 事件
  await nextTick();
  triggerLoadEvents();
});

/** 递归触发节点及其子节点的 load 事件（含命名 slot 子节点） */
function triggerLoadRecursive(node: ComponentNode): void {
  handleEvent(node, 'load');
  for (const child of node.children) {
    triggerLoadRecursive(child);
  }
  if (node.slots) {
    for (const slotChildren of Object.values(node.slots)) {
      for (const child of slotChildren) {
        triggerLoadRecursive(child);
      }
    }
  }
}

/** 触发当前页所有节点（含嵌套子节点）的 load 事件 */
function triggerLoadEvents(): void {
  if (!activePage.value) return;
  for (const node of activePage.value.components) {
    triggerLoadRecursive(node);
  }
}

/** 当前页 */
const activePage = computed<AppPage | null>(
  () => app.value?.pages.find((p) => p.id === activePageId.value) ?? null,
);

/** 确保某页的运行时状态已初始化（切换页时调用） */
function ensurePageState(pageId: string): void {
  if (pageStates[pageId] || !activePage.value) return;
  // 全局变量作为基底，页面变量覆盖同名全局变量
  const globalValues = buildInitialValues(app.value?.globalVariables ?? []);
  const pageValues = buildInitialValues(activePage.value.variables ?? []);
  pageStates[pageId] = {
    varValues: { ...globalValues, ...pageValues },
    inputValues: {},
    hiddenIds: new Set(),
  };
}

/** 切换页面 */
function switchPage(pageId: string): void {
  if (pageId === activePageId.value) return;
  activePageId.value = pageId;
  ensurePageState(pageId);
}

/** 当前页运行时状态（reactive，属性变更会触发依赖它的 computed 重算） */
const activeState = computed(() => pageStates[activePageId.value]);

/** 递归解析节点：替换 {{变量}}，过滤隐藏节点（含子节点和命名 slot 子节点） */
function resolveNode(node: ComponentNode): ComponentNode | null {
  if (!activeState.value || activeState.value.hiddenIds.has(node.id)) return null;
  const values = activeState.value.varValues;
  const resolvedProps: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node.props)) {
    resolvedProps[k] = resolveValue(v, values);
  }
  // 递归解析命名 slot 子节点
  const resolvedSlots: Record<string, ComponentNode[]> = {};
  if (node.slots) {
    for (const [slotName, slotChildren] of Object.entries(node.slots)) {
      resolvedSlots[slotName] = slotChildren
        .map(resolveNode)
        .filter((n): n is ComponentNode => n !== null);
    }
  }
  return {
    ...node,
    props: resolvedProps,
    children: node.children
      .map(resolveNode)
      .filter((n): n is ComponentNode => n !== null),
    slots: Object.keys(resolvedSlots).length ? resolvedSlots : undefined,
  };
}

/** 当前页解析后的节点（props 中的 {{变量}} 已替换为运行时值，含子节点递归） */
const resolvedNodes = computed<ComponentNode[]>(() => {
  if (!activePage.value) return [];
  return activePage.value.components
    .map(resolveNode)
    .filter((n): n is ComponentNode => n !== null);
});

/** 解析事件配置文本：先替换 {{$self}}（触发组件值），再替换 {{变量名}} */
function resolveEventText(text: string, selfValue: unknown): string {
  if (!activeState.value) return text;
  const self = selfValue === undefined ? '' : String(selfValue);
  return resolveTemplate(text.replace(/\{\{\s*\$self\s*\}\}/g, self), activeState.value.varValues);
}

/** 执行节点事件：一个事件触发后按序执行其绑定的所有动作 */
function handleEvent(node: ComponentNode, eventType: ComponentEvent['type']): void {
  if (!activeState.value || !activePage.value) return;
  const selfValue = activeState.value.inputValues[node.id];
  const matched = (node.events ?? []).filter((e) => e.type === eventType);
  for (const ev of matched) {
    for (const act of ev.actions) {
      runAction(act.action, act.config, selfValue);
    }
  }
}

function runAction(
  action: string,
  config: EventActionConfig | undefined,
  selfValue: unknown,
): void {
  if (!config) config = {};
  const state = activeState.value;
  if (!state) return;
  switch (action) {
    case 'openUrl': {
      const url = resolveEventText(config.url ?? '', selfValue);
      if (url) window.open(url, '_blank');
      break;
    }
    case 'showMessage': {
      const type = config.messageType ?? 'info';
      const text = resolveEventText(config.messageText ?? '', selfValue);
      ElMessage[type](text);
      break;
    }
    case 'setVariable': {
      if (!config.variableId || !activePage.value) break;
      const variable = activePage.value.variables.find((v) => v.id === config!.variableId);
      if (!variable) break;
      const raw = resolveEventText(config.variableValue ?? '', selfValue);
      const val = coerceValue(raw, variable.type);
      state.varValues[variable.name] = val;
      break;
    }
    case 'showComponent':
      if (config.targetId) state.hiddenIds.delete(config.targetId);
      break;
    case 'hideComponent':
      if (config.targetId) state.hiddenIds.add(config.targetId);
      break;
    case 'toggleComponent':
      if (config.targetId) {
        if (state.hiddenIds.has(config.targetId)) state.hiddenIds.delete(config.targetId);
        else state.hiddenIds.add(config.targetId);
      }
      break;
    case 'switchPage':
      if (config.pageId && app.value?.pages.some((p) => p.id === config.pageId)) {
        switchPage(config.pageId);
      }
      break;
    case 'openModal':
    case 'closeModal': {
      const modalId = config.modalId ?? '';
      ElMessage.info(
        `${action === 'openModal' ? '打开弹窗' : '关闭弹窗'}（占位）：${modalId || '未指定弹窗 id'}`,
      );
      break;
    }
    case 'callWorkflow': {
      const wfId = config.workflowId ?? '';
      const params = resolveEventText(config.workflowParams ?? '', selfValue);
      ElMessage.info(`调用工作流（占位）：${wfId || '未指定 id'}，入参：${params || '无'}`);
      break;
    }
    case 'none':
    default:
      break;
  }
}

/** 按变量类型转换字面量 */
function coerceValue(
  raw: string,
  type: 'string' | 'number' | 'boolean',
): string | number | boolean {
  if (type === 'number') {
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  if (type === 'boolean') {
    return raw === 'true' || raw === '1';
  }
  return raw;
}

/**
 * 输入值回调（NodeWrapper 透传）
 * 写入响应式 inputValues 后同步触发 change 事件链，
 * 让该输入组件配置的 setVariable 等动作即时执行，
 * 从而实现「输入框值变化 → 联动其他组件」的响应式数据流。
 */
function handleInput(node: ComponentNode, value: string): void {
  if (!activeState.value) return;
  activeState.value.inputValues[node.id] = value;
  // 触发 change 事件链：动作中的 setVariable 会更新 varValues（响应式），
  // 依赖该变量的组件的 resolveNode computed 会自动重算并重渲染。
  handleEvent(node, 'change');
}

function onBack(): void {
  router.push(`/app/${route.params.appId}/edit`);
}
</script>

<template>
  <div class="preview-page">
    <header class="preview-header">
      <el-button text :icon="ArrowLeft" @click="onBack">返回编辑</el-button>
      <span class="preview-title">{{ app?.name ?? '预览' }}</span>
    </header>

    <!-- 多页面切换 -->
    <div v-if="app && app.pages.length > 1" class="page-tabs">
      <div
        v-for="page in app.pages"
        :key="page.id"
        class="page-tab"
        :class="{ active: activePageId === page.id }"
        @click="switchPage(page.id)"
      >
        <el-icon v-if="app.homePageId === page.id" class="home-icon" title="首页">
          <HomeFilled />
        </el-icon>
        <span class="tab-name">{{ page.name }}</span>
      </div>
    </div>

    <main class="preview-main">
      <div v-if="!app" class="loading">加载中...</div>
      <div v-else-if="resolvedNodes.length === 0" class="empty">该页面暂无内容</div>
      <div v-else class="preview-content">
        <NodeWrapper
          v-for="node in resolvedNodes"
          :key="node.id"
          :node="node"
          readonly
          :event-handler="handleEvent"
          :input-handler="handleInput"
        />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.preview-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-2);

  .preview-header {
    display: flex;
    flex-shrink: 0;
    gap: 12px;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    background: var(--color-bg-1);
    border-bottom: 1px solid var(--color-border);

    .preview-title {
      font-size: 15px;
      font-weight: 600;
    }
  }

  .page-tabs {
    display: flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    background: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border);

    .page-tab {
      display: flex;
      gap: 4px;
      align-items: center;
      height: 30px;
      padding: 0 10px;
      color: var(--color-text-2);
      cursor: pointer;
      background: var(--color-bg-1);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      transition: all 0.15s;

      &:hover {
        color: var(--color-primary);
        border-color: var(--color-primary);
      }

      &.active {
        color: var(--color-primary);
        background: var(--color-primary-light);
        border-color: var(--color-primary);
      }

      .home-icon {
        font-size: 13px;
        color: var(--color-warning);
      }

      .tab-name {
        max-width: 120px;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .preview-main {
    display: flex;
    flex: 1;
    justify-content: center;
    padding: 32px 0;
    overflow-y: auto;

    .loading,
    .empty {
      padding: 80px 0;
      font-size: 14px;
      color: var(--color-text-4);
    }

    .preview-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      max-width: 720px;
      padding: 24px;
      background: var(--color-bg-1);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
  }
}
</style>
