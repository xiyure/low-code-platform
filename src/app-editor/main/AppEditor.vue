<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEditorStore } from '@/store/editorStore';
import { spaceApi } from '@/space/infrastructure/spaceApi';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  RefreshLeft,
  RefreshRight,
  View,
  Check,
  Operation,
  Plus,
  HomeFilled,
} from '@element-plus/icons-vue';
import type { AppListItem } from '@/types';
import ComponentPanel from './ComponentPanel.vue';
import Canvas from './Canvas.vue';
import PropertyPanel from './PropertyPanel.vue';
import VariableDrawer from './VariableDrawer.vue';

const route = useRoute();
const router = useRouter();
const editor = useEditorStore();
const app = ref<AppListItem | null>(null);
const saving = ref(false);
const varDrawerVisible = ref(false);

onMounted(async () => {
  const appId = route.params.appId as string;
  const data = await spaceApi.getApp(appId);
  if (!data) {
    ElMessage.error('应用不存在');
    router.back();
    return;
  }
  app.value = data;
  editor.loadFromApp(data);
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

function onKeydown(e: KeyboardEvent): void {
  const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
  const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));
  if (isUndo) {
    e.preventDefault();
    editor.undo();
  } else if (isRedo) {
    e.preventDefault();
    editor.redo();
  }
}

async function onSave(): Promise<void> {
  if (!app.value) return;
  saving.value = true;
  try {
    const { pages, homePageId } = editor.toAppData();
    await spaceApi.saveApp({
      ...app.value,
      pages,
      homePageId,
    });
    ElMessage.success('已保存');
  } finally {
    saving.value = false;
  }
}

async function onPreview(): Promise<void> {
  await onSave();
  if (app.value) {
    router.push(`/app/${app.value.id}/preview`);
  }
}

function onBack(): void {
  router.push('/apps');
}

// ===== 页面管理 =====
function onAddPage(): void {
  editor.addPage();
}

async function onRenamePage(pageId: string, oldName: string): Promise<void> {
  const { value } = await ElMessageBox.prompt('页面名称', '重命名页面', {
    inputValue: oldName,
    inputPattern: /\S+/,
    inputErrorMessage: '名称不能为空',
  });
  editor.renamePage(pageId, value);
}

async function onRemovePage(pageId: string, name: string): Promise<void> {
  await ElMessageBox.confirm(`确定删除页面「${name}」？`, '删除页面', {
    type: 'warning',
  });
  editor.removePage(pageId);
}
</script>

<template>
  <div class="app-editor">
    <header class="editor-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" @click="onBack">返回</el-button>
        <span class="app-name">{{ app?.name ?? '加载中' }}</span>
      </div>
      <div class="header-right">
        <el-button :icon="Operation" @click="varDrawerVisible = true">变量</el-button>
        <el-button :icon="RefreshLeft" :disabled="!editor.canUndo" @click="editor.undo()">
          撤销
        </el-button>
        <el-button :icon="RefreshRight" :disabled="!editor.canRedo" @click="editor.redo()">
          重做
        </el-button>
        <el-button :icon="View" @click="onPreview">预览</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="onSave"> 保存 </el-button>
      </div>
    </header>

    <!-- 页面 Tab 栏 -->
    <div class="page-tabs">
      <div
        v-for="page in editor.pages"
        :key="page.id"
        class="page-tab"
        :class="{ active: editor.activePageId === page.id }"
        @click="editor.switchPage(page.id)"
      >
        <el-icon v-if="editor.homePageId === page.id" class="home-icon" title="首页">
          <HomeFilled />
        </el-icon>
        <span class="tab-name">{{ page.name }}</span>
        <el-dropdown trigger="click" @click.stop @command="(cmd) => {
          if (cmd === 'rename') onRenamePage(page.id, page.name);
          else if (cmd === 'home') editor.setHomePage(page.id);
          else if (cmd === 'delete') onRemovePage(page.id, page.name);
        }">
          <el-icon class="tab-more"><Operation /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">重命名</el-dropdown-item>
              <el-dropdown-item command="home">设为首页</el-dropdown-item>
              <el-dropdown-item
                command="delete"
                :disabled="editor.pages.length <= 1"
              >
                删除页面
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-button class="page-add" circle title="新建页面" @click="onAddPage">
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>

    <div class="editor-body">
      <ComponentPanel />
      <Canvas />
      <PropertyPanel />
    </div>
    <VariableDrawer v-model="varDrawerVisible" />
  </div>
</template>

<style scoped>
.app-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-1);
}

.editor-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.app-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
}

.header-right {
  display: flex;
  gap: 8px;
}

/* 页面 Tab 栏 */
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
  position: relative;
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

.tab-more {
  font-size: 14px;
  color: var(--color-text-3);
  cursor: pointer;
}

.tab-more:hover {
  color: var(--color-primary);
}

.page-add {
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--color-text-3);
  background: transparent;
  border: 1px dashed var(--color-border);
  transition: all 0.15s;
}

.page-add:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
