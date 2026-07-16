<script setup lang="ts">
import { materialGroups, listMaterialsByGroup } from '@/app-editor/material/registry';

const groups = listMaterialsByGroup();

function onDragStart(e: DragEvent, materialId: string): void {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData('application/x-material-id', materialId);
  e.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <aside class="component-panel">
    <div class="panel-title">组件库</div>
    <div class="panel-body">
      <div v-for="group in materialGroups" :key="group.key" class="material-group">
        <div class="group-name">{{ group.name }}</div>
        <div class="material-list">
          <div
            v-for="mat in groups[group.key]"
            :key="mat.id"
            class="material-item"
            draggable="true"
            @dragstart="onDragStart($event, mat.id)"
          >
            <el-icon class="material-icon">
              <component :is="mat.icon" />
            </el-icon>
            <span class="material-name">{{ mat.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.component-panel {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 260px;
  background: var(--color-bg-1);
  border-right: 1px solid var(--color-border);
}

.panel-title {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  border-bottom: 1px solid var(--color-border);
}

.panel-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.material-group {
  margin-bottom: 16px;
}

.group-name {
  padding: 0 4px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-3);
}

.material-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.material-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  cursor: grab;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.material-item:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.material-item:active {
  cursor: grabbing;
}

.material-icon {
  font-size: 20px;
  color: var(--color-text-2);
}

.material-name {
  font-size: 12px;
  color: var(--color-text-2);
}
</style>
