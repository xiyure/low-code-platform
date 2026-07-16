import type { AppListItem } from '@/types';

/** 应用可编辑字段（仅元信息，不含画布数据） */
export interface AppMetaPatch {
  name?: string;
  description?: string;
  coverColor?: string;
}

/** 应用相关接口契约 */
export interface SpaceApi {
  listApps(): Promise<AppListItem[]>;
  getApp(appId: string): Promise<AppListItem | null>;
  saveApp(app: AppListItem): Promise<void>;
  deleteApp(appId: string): Promise<void>;
  createApp(name: string, description?: string): Promise<AppListItem>;
  updateApp(appId: string, patch: AppMetaPatch): Promise<AppListItem>;
}
