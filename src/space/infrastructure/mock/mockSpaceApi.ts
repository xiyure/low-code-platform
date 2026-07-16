/**
 * 应用 / 空间数据的 localStorage Mock 实现
 *
 * 首期无服务端时使用；接入后端后将由 api/space.ts 切换为真实 HTTP 调用。
 */
import type {
  AppListItem,
  AppPage,
  ComponentNode,
  ComponentEvent,
  EventAction,
  Variable,
} from '@/types';
import { mockApps } from './seedData';
import { readJson, writeJson, storageKeys, genId } from '@/utils/common';
import type { AppMetaPatch, SpaceApi } from '../apiContract';

/** 旧版事件结构（一对一：type + action + config） */
interface LegacyEvent {
  type: ComponentEvent['type'];
  action?: string;
  config?: ComponentEvent['actions'][number]['config'];
}

/** 旧版单页面应用结构（components/variables 直接挂在 app 上） */
interface LegacyApp {
  components?: ComponentNode[];
  variables?: Variable[];
  pages?: AppPage[];
  homePageId?: string;
}

/** 迁移旧版应用数据：单页面结构升级为 pages、事件结构升级为一对多 */
function migrateApps(apps: AppListItem[]): AppListItem[] {
  return apps.map((a) => {
    const legacy = a as AppListItem & LegacyApp;
    // 已是多页面结构：仅迁移节点
    if (Array.isArray(legacy.pages) && legacy.pages.length > 0) {
      return {
        ...a,
        pages: legacy.pages.map((p) => ({
          ...p,
          variables: Array.isArray(p.variables) ? p.variables : [],
          components: p.components.map(migrateNode),
        })),
      };
    }
    // 旧版单页面：components/variables 包成首页
    const homeId = genId();
    return {
      ...a,
      pages: [
        {
          id: homeId,
          name: '首页',
          variables: Array.isArray(legacy.variables) ? legacy.variables : [],
          components: (legacy.components ?? []).map(migrateNode),
        },
      ],
      homePageId: homeId,
    };
  });
}

function migrateNode(n: ComponentNode): ComponentNode {
  // 旧版自由画布的 position 字段已废弃，迁移时剔除
  const { position: _position, ...rest } = n as ComponentNode & { position?: unknown };
  void _position;

  const events = (n.events ?? []).map(migrateEvent);
  return {
    ...rest,
    events,
    children: (n.children ?? []).map(migrateNode),
  };
}

/** 旧事件（{ type, action, config }）升级为新结构（{ type, actions: [{id, action, config}] }） */
function migrateEvent(e: ComponentEvent | LegacyEvent): ComponentEvent {
  // 已是新结构（含 actions 数组）
  if (Array.isArray((e as ComponentEvent).actions)) {
    return e as ComponentEvent;
  }
  // 旧结构：把单个 action/config 包成 actions 数组
  const legacy = e as LegacyEvent;
  const action = (legacy.action ?? 'none') as EventAction['action'];
  const act: EventAction = { id: genId(), action, config: legacy.config ?? {} };
  return { type: legacy.type, actions: [act] };
}

/** 旧版节点是否含已废弃的 position 字段或旧事件结构 */
function hasLegacyData(n: ComponentNode): boolean {
  if ((n as ComponentNode & { position?: unknown }).position !== undefined) return true;
  const events = n.events ?? [];
  if (events.some((e) => !Array.isArray((e as ComponentEvent).actions))) return true;
  return (n.children ?? []).some(hasLegacyData);
}

/** 旧版单页面节点树是否含废弃字段/旧事件 */
function hasLegacyPageData(a: AppListItem): boolean {
  const legacy = a as AppListItem & LegacyApp;
  // 旧版单页面结构（无 pages，有 components）
  if (!Array.isArray(legacy.pages) || legacy.pages.length === 0) {
    return (legacy.components ?? []).some(hasLegacyData);
  }
  return legacy.pages.some((p) => (p.components ?? []).some(hasLegacyData));
}

/** 首启注入种子数据；若存在旧版结构则迁移 */
function seedIfEmpty(): void {
  const apps = readJson<AppListItem[] | null>(storageKeys.apps, null);
  if (!apps) {
    writeJson(storageKeys.apps, mockApps);
    return;
  }
  const needMigrate = apps.some(
    (a) => !Array.isArray((a as AppListItem & LegacyApp).pages) || hasLegacyPageData(a),
  );
  if (needMigrate) writeJson(storageKeys.apps, migrateApps(apps));
}

// 模块加载时执行种子注入与迁移
seedIfEmpty();

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const COVER_COLORS = ['#2B6BFF', '#7B61FF', '#00B42A', '#FF7D00', '#F53F3F', '#0FC6C2'];
function pickCoverColor(index: number): string {
  return COVER_COLORS[index % COVER_COLORS.length] ?? '#2B6BFF';
}

/** Mock 实现：基于 localStorage 的应用接口 */
export const mockSpaceApi: SpaceApi = {
  async listApps(): Promise<AppListItem[]> {
    const apps = readJson<AppListItem[]>(storageKeys.apps, []);
    return delay(apps);
  },

  async getApp(appId: string): Promise<AppListItem | null> {
    const apps = readJson<AppListItem[]>(storageKeys.apps, []);
    return delay(apps.find((a) => a.id === appId) ?? null);
  },

  async saveApp(app: AppListItem): Promise<void> {
    const apps = readJson<AppListItem[]>(storageKeys.apps, []);
    const idx = apps.findIndex((a) => a.id === app.id);
    const next: AppListItem = { ...app, updatedAt: Date.now() };
    if (idx >= 0) apps[idx] = next;
    else apps.push(next);
    writeJson(storageKeys.apps, apps);
    return delay(undefined);
  },

  async deleteApp(appId: string): Promise<void> {
    const apps = readJson<AppListItem[]>(storageKeys.apps, []);
    writeJson(
      storageKeys.apps,
      apps.filter((a) => a.id !== appId),
    );
    return delay(undefined);
  },

  async createApp(name: string, description?: string): Promise<AppListItem> {
    const apps = readJson<AppListItem[]>(storageKeys.apps, []);
    const homeId = `page_${Date.now().toString(36)}`;
    const app: AppListItem = {
      id: `app_${Date.now().toString(36)}`,
      name,
      description: description ?? '',
      coverColor: pickCoverColor(apps.length),
      updatedAt: Date.now(),
      homePageId: homeId,
      pages: [{ id: homeId, name: '首页', components: [], variables: [] }],
    };
    apps.push(app);
    writeJson(storageKeys.apps, apps);
    return delay(app);
  },

  async updateApp(appId: string, patch: AppMetaPatch): Promise<AppListItem> {
    const apps = readJson<AppListItem[]>(storageKeys.apps, []);
    const idx = apps.findIndex((a) => a.id === appId);
    if (idx < 0) throw new Error(`应用不存在: ${appId}`);
    const next: AppListItem = {
      ...apps[idx],
      ...patch,
      updatedAt: Date.now(),
    };
    apps[idx] = next;
    writeJson(storageKeys.apps, apps);
    return delay(next);
  },
};
