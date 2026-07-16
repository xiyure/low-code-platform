import { createRouter, createWebHistory } from 'vue-router';
import WorkspaceLayout from '@/space/presentation/WorkspaceLayout.vue';
import SpaceHome from '@/space/presentation/SpaceHome.vue';
import AppEditor from '@/app-editor/main/AppEditor.vue';
import AppPreview from '@/app-editor/preview/AppPreview.vue';

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
