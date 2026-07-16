<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import type { EventAction, EventActionConfig, EventActionType } from '@/types';
import { Delete, Top, Bottom } from '@element-plus/icons-vue';

const props = defineProps<{
  action: EventAction;
}>();
const emit = defineEmits<{
  (e: 'update', patch: Partial<EventAction>): void;
  (e: 'remove'): void;
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
}>();

const editor = useEditorStore();

const actionOptions: { label: string; value: EventActionType }[] = [
  { label: '打开链接', value: 'openUrl' },
  { label: '跳转页面', value: 'switchPage' },
  { label: '显示消息', value: 'showMessage' },
  { label: '设置变量', value: 'setVariable' },
  { label: '显示组件', value: 'showComponent' },
  { label: '隐藏组件', value: 'hideComponent' },
  { label: '切换显隐', value: 'toggleComponent' },
];

const msgTypeOptions = [
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '信息', value: 'info' },
  { label: '错误', value: 'error' },
];

function updateAction(action: EventActionType): void {
  emit('update', { action, config: {} });
}

function updateConfig(patch: Partial<EventActionConfig>): void {
  emit('update', { config: { ...props.action.config, ...patch } });
}

const insertPicker = ref('');
function insertVar(field: 'messageText' | 'variableValue', name: string): void {
  const cur = (props.action.config?.[field] as string) ?? '';
  updateConfig({ [field]: cur + `{{${name}}}` } as Partial<EventActionConfig>);
  insertPicker.value = '';
}
</script>

<template>
  <div class="action-item">
    <div class="action-row">
      <el-select
        :model-value="action.action"
        size="small"
        class="action-select"
        @update:model-value="(v) => updateAction(v as EventActionType)"
      >
        <el-option
          v-for="opt in actionOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <div class="action-ops">
        <el-button class="op-btn" text size="small" title="上移" @click="$emit('moveUp')">
          <el-icon><Top /></el-icon>
        </el-button>
        <el-button class="op-btn" text size="small" title="下移" @click="$emit('moveDown')">
          <el-icon><Bottom /></el-icon>
        </el-button>
        <el-button class="op-btn danger" text size="small" title="删除" @click="$emit('remove')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 打开链接 -->
    <template v-if="action.action === 'openUrl'">
      <el-input
        :model-value="action.config?.url ?? ''"
        size="small"
        placeholder="https://..."
        @update:model-value="(v) => updateConfig({ url: String(v) })"
      />
    </template>

    <!-- 显示消息 -->
    <template v-else-if="action.action === 'showMessage'">
      <el-select
        :model-value="action.config?.messageType ?? 'info'"
        size="small"
        @update:model-value="
          (v) => updateConfig({ messageType: v as EventActionConfig['messageType'] })
        "
      >
        <el-option
          v-for="opt in msgTypeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-input
        :model-value="action.config?.messageText ?? ''"
        size="small"
        placeholder="消息内容，支持 {{变量名}}"
        @update:model-value="(v) => updateConfig({ messageText: String(v) })"
      />
      <el-select
        v-if="editor.variables.length > 0"
        v-model="insertPicker"
        size="small"
        placeholder="插入变量"
        @change="(v) => insertVar('messageText', String(v))"
      >
        <el-option v-for="v in editor.variables" :key="v.id" :label="v.name" :value="v.name" />
      </el-select>
    </template>

    <!-- 设置变量 -->
    <template v-else-if="action.action === 'setVariable'">
      <el-select
        :model-value="action.config?.variableId"
        size="small"
        placeholder="选择变量"
        @update:model-value="(v) => updateConfig({ variableId: String(v) })"
      >
        <el-option v-for="v in editor.variables" :key="v.id" :label="v.name" :value="v.id" />
      </el-select>
      <el-input
        :model-value="action.config?.variableValue ?? ''"
        size="small"
        placeholder="新值，支持 {{变量名}} 或 {{$self}}"
        @update:model-value="(v) => updateConfig({ variableValue: String(v) })"
      />
      <el-select
        v-if="editor.variables.length > 0"
        v-model="insertPicker"
        size="small"
        placeholder="插入变量"
        @change="(v) => insertVar('variableValue', String(v))"
      >
        <el-option v-for="v in editor.variables" :key="v.id" :label="v.name" :value="v.name" />
      </el-select>
    </template>

    <!-- 显示/隐藏/切换组件 -->
    <template
      v-else-if="['showComponent', 'hideComponent', 'toggleComponent'].includes(action.action)"
    >
      <el-select
        :model-value="action.config?.targetId"
        size="small"
        placeholder="选择目标组件"
        @update:model-value="(v) => updateConfig({ targetId: String(v) })"
      >
        <el-option
          v-for="n in editor.nodes"
          :key="n.id"
          :label="`${n.name} (${n.id.slice(0, 6)})`"
          :value="n.id"
        />
      </el-select>
    </template>

    <!-- 跳转页面 -->
    <template v-else-if="action.action === 'switchPage'">
      <el-select
        :model-value="action.config?.pageId"
        size="small"
        placeholder="选择目标页面"
        @update:model-value="(v) => updateConfig({ pageId: String(v) })"
      >
        <el-option
          v-for="p in editor.pages"
          :key="p.id"
          :label="p.name + (editor.homePageId === p.id ? '（首页）' : '')"
          :value="p.id"
        />
      </el-select>
      <div v-if="editor.pages.length <= 1" class="action-tip">当前应用只有 1 个页面，请新建页面后再使用此动作</div>
    </template>
  </div>
</template>

<style scoped>
.action-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.action-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-select {
  flex: 1;
}

.action-ops {
  display: flex;
  gap: 2px;
}

.op-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--color-text-3);
}

.op-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.op-btn.danger:hover {
  color: var(--color-danger);
  background: rgb(245 63 63 / 10%);
}

.action-tip {
  padding: 4px 6px;
  font-size: 11px;
  color: var(--color-warning);
}
</style>
