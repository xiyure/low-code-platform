<script setup lang="ts">
import { computed, ref, markRaw } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Files, Setting, Star, Bell } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

// 左侧菜单：当前仅"项目管理"，后续可扩展
interface MenuItem {
  key: string;
  label: string;
  icon: typeof Files;
  path?: string;
}
const menus = ref<MenuItem[]>([
  { key: 'project', label: '项目管理', icon: markRaw(Files), path: '/apps' },
]);

const activeMenu = computed(() => {
  // 当前在应用列表即"项目管理"
  if (route.name === 'apps') return 'project';
  return '';
});
</script>

<template>
  <div class="workspace-layout">
    <header class="workspace-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-mark">Z</span>
          <span class="logo-text">低代码应用平台</span>
        </div>
      </div>
      <div class="header-right">
        <el-icon class="header-icon" title="收藏"><Star /></el-icon>
        <el-icon class="header-icon" title="通知"><Bell /></el-icon>
        <el-icon class="header-icon" title="设置"><Setting /></el-icon>
        <el-avatar :size="32" class="avatar">我</el-avatar>
      </div>
    </header>

    <div class="workspace-body">
      <!-- 左侧菜单栏 -->
      <aside class="side-menu">
        <div
          v-for="m in menus"
          :key="m.key"
          class="menu-item"
          :class="{ active: activeMenu === m.key }"
          @click="m.path && router.push(m.path)"
        >
          <el-icon class="menu-icon"><component :is="m.icon" /></el-icon>
          <span class="menu-label">{{ m.label }}</span>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="workspace-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.workspace-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.workspace-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  gap: 24px;
  align-items: center;
}

.logo {
  display: flex;
  gap: 8px;
  align-items: center;
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border-radius: var(--radius-md);
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
}

.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-icon {
  font-size: 18px;
  color: var(--color-text-3);
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary);
  }
}

/* 主体：左侧菜单 + 内容 */
.workspace-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.side-menu {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  width: 200px;
  padding: 16px 12px;
  background: var(--color-bg-1);
  border-right: 1px solid var(--color-border);
}

.menu-item {
  display: flex;
  gap: 10px;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--color-text-2);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s;

  &:hover {
    color: var(--color-text-1);
    background: var(--color-bg-2);
  }

  &.active {
    font-weight: 600;
    color: var(--color-primary);
    background: var(--color-primary-light);
  }
}

.menu-icon {
  font-size: 16px;
}

.workspace-main {
  flex: 1;
  overflow: auto;
}

.avatar {
  color: #fff;
  cursor: pointer;
  background: var(--color-primary);
}
</style>
