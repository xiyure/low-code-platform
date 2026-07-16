<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spaceApi } from '@/space/infrastructure/spaceApi';
import ComponentRenderer from '@/app-editor/material/ComponentRenderer.vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, HomeFilled } from '@element-plus/icons-vue';
import type { AppListItem, AppPage, ComponentNode, ComponentEvent, EventActionConfig } from '@/types';
import { resolveTemplate, resolveValue, buildInitialValues } from '@/utils/common';

const route = useRoute();
const router = useRouter();
const app = ref<AppListItem | null>(null);
/** 当前预览的页面 id（默认首页） */
const activePageId = ref<string>('');
/** 每页的运行时状态（页面切换时各自独立保留） */
const pageStates = ref<
  Record<
    string,
    {
      varValues: Record<string, string | number | boolean>;
      inputValues: Record<string, string>;
      hiddenIds: Set<string>;
    }
  >
>({});

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
});

/** 当前页 */
const activePage = computed<AppPage | null>(
  () => app.value?.pages.find((p) => p.id === activePageId.value) ?? null,
);

/** 确保某页的运行时状态已初始化（切换页时调用） */
function ensurePageState(pageId: string): void {
  if (pageStates.value[pageId] || !activePage.value) return;
  pageStates.value[pageId] = {
    varValues: buildInitialValues(activePage.value.variables ?? []),
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

/** 当前页运行时状态（只读） */
const activeState = computed(() => pageStates.value[activePageId.value]);

/** 当前页解析后的节点（props 中的 {{变量}} 已替换为运行时值） */
const resolvedNodes = computed<ComponentNode[]>(() => {
  if (!activePage.value || !activeState.value) return [];
  const values = activeState.value.varValues;
  return activePage.value.components
    .filter((n) => !activeState.value.hiddenIds.has(n.id))
    .map((node) => {
      const resolvedProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node.props)) {
        resolvedProps[k] = resolveValue(v, values);
      }
      return { ...node, props: resolvedProps };
    });
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

function onInput(e: Event, nodeId: string): void {
  const target = e.target as HTMLInputElement;
  if (!activeState.value) return;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    activeState.value.inputValues[nodeId] = target.value;
  }
}

function onNodeClick(node: ComponentNode): void {
  handleEvent(node, 'click');
}

function onChange(node: ComponentNode): void {
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
        <div
          v-for="node in resolvedNodes"
          :key="node.id"
          class="preview-node"
          :style="{ width: node.size.width + 'px' }"
          @click="onNodeClick(node)"
          @input="onInput($event, node.id)"
          @change="onChange(node)"
        >
          <ComponentRenderer :node="node" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.preview-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-2);
}

.preview-header {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border);
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
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
}

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
}

.page-tab:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.page-tab.active {
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

.preview-main {
  display: flex;
  flex: 1;
  justify-content: center;
  padding: 32px 0;
  overflow-y: auto;
}

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

.preview-node {
  width: 100%;
}
</style>
