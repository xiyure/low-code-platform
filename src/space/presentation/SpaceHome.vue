<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSpaceStore } from '@/store/spaceStore';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Search,
  Clock,
  Files,
  MoreFilled,
  Edit,
  Delete,
  VideoPlay,
} from '@element-plus/icons-vue';
import { formatTime } from '@/utils/common';
import type { AppListItem } from '@/types';

const router = useRouter();
const spaceStore = useSpaceStore();

const keyword = ref('');

// 创建应用
const createVisible = ref(false);
const createName = ref('');
const createDesc = ref('');
const creating = ref(false);

// 编辑应用
const editVisible = ref(false);
const editName = ref('');
const editDesc = ref('');
const editing = ref(false);
const editingId = ref<string>('');

const filtered = computed<AppListItem[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  const list = spaceStore.apps;
  if (!kw) return list;
  return list.filter(
    (item) =>
      item.name.toLowerCase().includes(kw) || (item.description ?? '').toLowerCase().includes(kw),
  );
});

// ===== 创建 =====
function openCreate(): void {
  createName.value = '';
  createDesc.value = '';
  createVisible.value = true;
}

async function confirmCreate(): Promise<void> {
  const name = createName.value.trim();
  if (!name) {
    ElMessage.warning('请输入应用名称');
    return;
  }
  creating.value = true;
  try {
    const app = await spaceStore.createApp(name, createDesc.value.trim());
    createVisible.value = false;
    router.push(`/app/${app.id}/edit`);
  } finally {
    creating.value = false;
  }
}

// ===== 编辑 =====
function openEdit(item: AppListItem): void {
  editingId.value = item.id;
  editName.value = item.name;
  editDesc.value = item.description;
  editVisible.value = true;
}

async function confirmEdit(): Promise<void> {
  const name = editName.value.trim();
  if (!name) {
    ElMessage.warning('请输入应用名称');
    return;
  }
  editing.value = true;
  try {
    await spaceStore.updateApp(editingId.value, {
      name,
      description: editDesc.value.trim(),
    });
    ElMessage.success('已更新');
    editVisible.value = false;
  } finally {
    editing.value = false;
  }
}

// ===== 卡片操作（下拉菜单） =====
function onCommand(cmd: string, item: AppListItem): void {
  if (cmd === 'run') onRun(item);
  else if (cmd === 'edit') openEdit(item);
  else if (cmd === 'delete') onDelete(item);
}

/** 运行：新标签打开预览页 */
function onRun(item: AppListItem): void {
  const url = router.resolve(`/app/${item.id}/preview`).href;
  window.open(url, '_blank');
}

async function onDelete(item: AppListItem): Promise<void> {
  await ElMessageBox.confirm(`确定删除「${item.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  });
  await spaceStore.deleteApp(item.id);
  ElMessage.success('已删除');
}

function enterItem(item: AppListItem): void {
  router.push(`/app/${item.id}/edit`);
}
</script>

<template>
  <div class="space-home">
    <section class="space-toolbar">
      <div class="toolbar-actions">
        <el-input
          v-model="keyword"
          placeholder="搜索应用"
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建应用</el-button>
      </div>
    </section>

    <section class="space-content">
      <div v-if="filtered.length > 0" class="card-grid">
        <div v-for="item in filtered" :key="item.id" class="resource-card" @click="enterItem(item)">
          <!-- 卡片右上角操作下拉 -->
          <el-dropdown
            class="card-more"
            trigger="click"
            placement="bottom-end"
            @click.stop
            @command="(cmd: string) => onCommand(cmd, item)"
          >
            <span class="card-more-icon" @click.stop.prevent>
              <el-icon><MoreFilled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="run" :icon="VideoPlay">运行</el-dropdown-item>
                <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete" :icon="Delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div class="card-cover" :style="{ background: item.coverColor }">
            <el-icon class="cover-icon"><Files /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-name">{{ item.name }}</div>
            <div class="card-desc">{{ item.description || '暂无描述' }}</div>
            <div class="card-meta">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(item.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-icon class="empty-icon"><Files /></el-icon>
        <p class="empty-text">暂无应用，点击右上角新建</p>
      </div>
    </section>

    <!-- 创建应用对话框 -->
    <el-dialog v-model="createVisible" title="创建应用" width="460px">
      <el-form @submit.prevent="confirmCreate">
        <el-form-item label="名称" label-width="60" required>
          <el-input
            v-model="createName"
            placeholder="请输入应用名称"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" label-width="60">
          <el-input
            v-model="createDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入应用描述（选填）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="confirmCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑应用对话框 -->
    <el-dialog v-model="editVisible" title="编辑应用" width="460px">
      <el-form @submit.prevent="confirmEdit">
        <el-form-item label="名称">
          <el-input
            v-model="editName"
            placeholder="请输入应用名称"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入应用描述"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="confirmEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.space-home {
  max-width: 1200px;
  padding: 32px 24px 48px;
  margin: 0 auto;
}

.space-banner {
  margin-bottom: 24px;
}

.banner-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
}

.banner-sub {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-3);
}

.space-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab-item {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--color-text-2);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  transition: all 0.2s;

  &.active {
    font-weight: 600;
    color: var(--color-primary);
    background: var(--color-primary-light);
  }
}

.toolbar-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 220px;
}

.space-content {
  min-height: 320px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.resource-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.card-cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  color: rgb(255 255 255 / 90%);
}

.cover-icon {
  font-size: 36px;
}

.card-body {
  padding: 12px 16px;
}

.card-name {
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

.card-desc {
  display: -webkit-box;
  min-height: 32px;
  margin-bottom: 8px;
  overflow: hidden;
  line-clamp: 2;
  font-size: 12px;
  color: var(--color-text-3);
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-3);
}

/* 卡片右上角操作图标（常显） */
.card-more {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.card-more-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 18px;
  line-height: 1;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 25%);
  border-radius: 50%;
  transition:
    color 0.2s,
    background 0.2s;

  &:hover,
  &.is-active {
    color: #1975ff;
    background: rgb(255 255 255 / 90%);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--color-text-3);
}

.empty-icon {
  margin-bottom: 12px;
  font-size: 48px;
  color: var(--color-text-4);
}

.empty-text {
  margin: 0;
  font-size: 14px;
}
</style>
