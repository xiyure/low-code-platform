<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { genId } from '@/utils/common';
import type { ComponentEvent, EventAction } from '@/types';
import ActionItem from './ActionItem.vue';

const props = defineProps<{
  event: ComponentEvent;
  index: number;
}>();
const emit = defineEmits<{
  (e: 'update', patch: Partial<ComponentEvent>): void;
  (e: 'remove'): void;
}>();

function addAction(): void {
  const next: EventAction[] = [
    ...props.event.actions,
    { id: genId(), action: 'showMessage', config: {} },
  ];
  emit('update', { actions: next });
}

function updateAction(actionId: string, patch: Partial<EventAction>): void {
  emit('update', {
    actions: props.event.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
  });
}

function removeAction(actionId: string): void {
  emit('update', {
    actions: props.event.actions.filter((a) => a.id !== actionId),
  });
}

function moveAction(actionId: string, dir: -1 | 1): void {
  const idx = props.event.actions.findIndex((a) => a.id === actionId);
  const target = idx + dir;
  if (idx < 0 || target < 0 || target >= props.event.actions.length) return;
  const arr = [...props.event.actions];
  [arr[idx], arr[target]] = [arr[target], arr[idx]];
  emit('update', { actions: arr });
}
</script>

<template>
  <div class="event-block">
    <div class="action-list">
      <ActionItem
        v-for="action in event.actions"
        :key="action.id"
        :action="action"
        @update="(patch) => updateAction(action.id, patch)"
        @remove="removeAction(action.id)"
        @move-up="moveAction(action.id, -1)"
        @move-down="moveAction(action.id, 1)"
      />
    </div>
    <div v-if="event.actions.length === 0" class="action-empty">暂无动作，点击下方添加</div>

    <el-button
      type="primary"
      plain
      size="small"
      :icon="Plus"
      class="add-action-btn"
      @click="addAction"
    >
      添加动作
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.event-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--color-bg-2);
  border-radius: var(--radius-md);

  .action-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .action-empty {
    padding: 8px 0;
    font-size: 12px;
    color: var(--color-text-4);
    text-align: center;
  }

  .add-action-btn {
    align-self: flex-start;
  }
}
</style>
