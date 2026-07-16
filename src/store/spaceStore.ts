import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AppListItem } from '@/types';
import { spaceApi } from '@/space/infrastructure/spaceApi';
import type { AppMetaPatch } from '@/space/infrastructure/apiContract';

export const useSpaceStore = defineStore('space', () => {
  const apps = ref<AppListItem[]>([]);
  const loading = ref(false);

  /** 初始化：加载应用列表 */
  async function init(): Promise<void> {
    await loadApps();
  }

  async function loadApps(): Promise<void> {
    loading.value = true;
    try {
      apps.value = await spaceApi.listApps();
    } finally {
      loading.value = false;
    }
  }

  async function createApp(name: string, description?: string): Promise<AppListItem> {
    const app = await spaceApi.createApp(name, description);
    apps.value = [app, ...apps.value];
    return app;
  }

  async function updateApp(id: string, patch: AppMetaPatch): Promise<AppListItem> {
    const updated = await spaceApi.updateApp(id, patch);
    apps.value = apps.value.map((a) => (a.id === id ? updated : a));
    return updated;
  }

  async function deleteApp(id: string): Promise<void> {
    await spaceApi.deleteApp(id);
    apps.value = apps.value.filter((a) => a.id !== id);
  }

  return {
    apps,
    loading,
    init,
    loadApps,
    createApp,
    updateApp,
    deleteApp,
  };
});
