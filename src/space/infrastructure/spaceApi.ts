/**
 * 应用接口统一出口
 *
 * 根据 VITE_USE_MOCK 切换 Mock 实现与真实接口实现：
 * - VITE_USE_MOCK=true（开发默认）：走 localStorage Mock
 * - VITE_USE_MOCK=false：走真实 HTTP 接口（基于 api/request.ts）
 *
 * 接入后端时：在 api/realSpaceApi.ts 中实现各接口，无需改动 store 层。
 */
import { mockSpaceApi } from './mock/mockSpaceApi';
import type { SpaceApi } from './apiContract';

/** 是否启用本地 Mock */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

// ===== 真实接口实现（接入后端时填充） =====
// 基于 http 封装，示例：
//   listApps: () => http.get<AppListItem[]>('/apps'),
const realSpaceApi: SpaceApi = {
  listApps: () => Promise.reject(new Error('真实接口未接入')),
  getApp: () => Promise.reject(new Error('真实接口未接入')),
  saveApp: () => Promise.reject(new Error('真实接口未接入')),
  deleteApp: () => Promise.reject(new Error('真实接口未接入')),
  createApp: () => Promise.reject(new Error('真实接口未接入')),
  updateApp: () => Promise.reject(new Error('真实接口未接入')),
};

export const spaceApi: SpaceApi = useMock ? mockSpaceApi : realSpaceApi;
