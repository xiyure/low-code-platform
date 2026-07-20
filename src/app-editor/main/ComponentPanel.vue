<script setup lang="ts">
import { ref } from 'vue';
import { materialGroups, listMaterialsByGroup } from '@/app-editor/material/registry';

const groups = listMaterialsByGroup();

// 默认展开所有分组
const activeGroups = ref<string[]>(materialGroups.map((g) => g.key));

function onDragStart(e: DragEvent, materialId: string): void {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData('application/x-material-id', materialId);
  e.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <aside class="component-panel">
    <div class="panel-title">组件库</div>
    <el-scrollbar class="panel-scroll">
      <div class="panel-body">
        <el-collapse v-model="activeGroups" class="group-collapse">
          <el-collapse-item
            v-for="group in materialGroups"
            :key="group.key"
            :name="group.key"
          >
            <template #title>
              <div class="group-title">
                <span class="group-name">{{ group.name }}</span>
                <span class="group-count">{{ groups[group.key].length }}</span>
              </div>
            </template>
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
              <div v-if="groups[group.key].length === 0" class="group-empty">
                暂无组件
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-scrollbar>
  </aside>
</template>

<style scoped lang="scss">
.component-panel {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 260px;
  background: var(--color-bg-1);
  border-right: 1px solid var(--color-border);

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

  .panel-scroll {
    flex: 1;
    height: 0;
  }

  .panel-body {
    padding: 8px;

    .group-collapse {
      border: none;

      :deep(.el-collapse-item__header) {
        height: 36px;
        padding-left: 4px;
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-1);
        background: transparent;
        border-bottom: none;
        border-radius: var(--radius-sm);
        transition: background 0.2s;

        &:hover {
          background: var(--color-bg-2);

          .group-count {
            color: var(--color-primary);
            background: var(--color-primary-light);
          }
        }

        &.is-active {
          .group-count {
            color: var(--color-primary);
            background: var(--color-primary-light);
          }
        }
      }

      :deep(.el-collapse-item__wrap) {
        background: transparent;
        border-bottom: none;
      }

      :deep(.el-collapse-item__content) {
        padding: 4px 0 12px;
      }
    }

    .group-title {
      display: flex;
      gap: 8px;
      align-items: center;

      .group-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 16px;
        padding: 0 5px;
        font-size: 11px;
        font-weight: 500;
        line-height: 1;
        color: var(--color-text-3);
        background: var(--color-bg-3);
        border-radius: 8px;
        transition: all 0.2s;
      }
    }

    .material-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;

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

        &:hover {
          background: var(--color-primary-light);
          border-color: var(--color-primary);
        }

        &:active {
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
      }

      .group-empty {
        grid-column: 1 / -1;
        padding: 16px;
        font-size: 12px;
        color: var(--color-text-4);
        text-align: center;
      }
    }
  }
}
</style>
