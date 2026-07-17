import { createRouter, createWebHistory } from 'vue-router';

// 路由级懒加载：每个页面拆为独立 chunk，减小首屏体积
const WorkspaceLayout = () => import('@/space/presentation/WorkspaceLayout.vue');
const SpaceHome = () => import('@/space/presentation/SpaceHome.vue');
const AppEditor = () => import('@/app-editor/main/AppEditor.vue');
const AppPreview = () => import('@/app-editor/preview/AppPreview.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/apps' },
    {
      path: '/apps',
      component: WorkspaceLayout,
      children: [{ path: '', name: 'apps', component: SpaceHome }],
    },
    {
      path: '/app/:appId/edit',
      name: 'app-editor',
      component: AppEditor,
    },
    {
      path: '/app/:appId/preview',
      name: 'app-preview',
      component: AppPreview,
    },
  ],
});

export default router;
