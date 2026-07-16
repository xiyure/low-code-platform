<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { materialRegistry } from '@/app-editor/material/registry';
import { Plus } from '@element-plus/icons-vue';
import type { ComponentEvent, PropertyField } from '@/types';
import EventBlock from './EventBlock.vue';

const editor = useEditorStore();

const node = computed(() => editor.selectedNode);
const meta = computed(() => (node.value ? materialRegistry[node.value.componentId] : null));

/** 属性字段（group=props 或无 group） */
const propFields = computed<PropertyField[]>(() =>
  (meta.value?.propertySchema ?? []).filter((f) => !f.group || f.group === 'props'),
);
const events = computed<ComponentEvent[]>(() => node.value?.events ?? []);

const tab = ref<'props' | 'style' | 'event'>('props');

// ===== 属性读写 =====
function getProp(key: string): string | number | boolean | undefined {
  const v = node.value?.props[key];
  return v as string | number | boolean | undefined;
}
function setProp(key: string, value: unknown): void {
  if (node.value) editor.updateProps(node.value.id, key, value);
}

/** 属性值追加变量引用 */
const propVarPicker = ref<Record<string, string>>({});
function insertVarToProp(key: string, name: string): void {
  const cur = String(getProp(key) ?? '');
  setProp(key, cur + `{{${name}}}`);
  propVarPicker.value[key] = '';
}

// ===== 组件名称编辑 =====
const editingName = ref(false);
const nameInput = ref('');
function startEditName(): void {
  if (!node.value) return;
  nameInput.value = node.value.name;
  editingName.value = true;
}
function commitName(): void {
  if (node.value && nameInput.value.trim()) {
    editor.updateNode(node.value.id, { name: nameInput.value.trim() });
  }
  editingName.value = false;
}

// ===== 样式读写 =====
function getStyle(key: string): string {
  return node.value?.style[key] ?? '';
}
function setStyle(key: string, value: string): void {
  if (node.value) editor.updateStyle(node.value.id, key, value);
}
/** 取数字型样式（自动去 px） */
function getStyleNum(key: string, fallback = 0): number {
  const v = getStyle(key);
  if (!v) return fallback;
  return Number(String(v).replace('px', '')) || 0;
}
/** 写数字型样式（自动加 px） */
function setStyleNum(key: string, val: number | undefined): void {
  setStyle(key, `${val ?? 0}px`);
}

const borderStyleOptions = [
  { label: '无', value: 'none' },
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
];
const fontWeightOptions = [
  { label: '常规', value: '400' },
  { label: '中等', value: '500' },
  { label: '加粗', value: '600' },
  { label: '特粗', value: '700' },
];
const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
];

// ===== 事件管理 =====
const typeLabel: Record<ComponentEvent['type'], string> = {
  click: '点击时',
  change: '值变化时',
  submit: '提交时',
  focus: '聚焦时',
  blur: '失焦时',
};

function addEvent(type: ComponentEvent['type']): void {
  if (!node.value) return;
  const next: ComponentEvent[] = [...events.value, { type, actions: [] }];
  editor.updateEvents(node.value.id, next);
}
function removeEvent(index: number): void {
  if (!node.value) return;
  editor.updateEvents(
    node.value.id,
    events.value.filter((_, i) => i !== index),
  );
}
function updateEvent(index: number, patch: Partial<ComponentEvent>): void {
  if (!node.value) return;
  editor.updateEvents(
    node.value.id,
    events.value.map((e, i) => (i === index ? { ...e, ...patch } : e)),
  );
}

/** 当前展开的事件卡片（按 index 展开，默认展开第一个） */
const expandedEvent = ref<number | number[]>(0);
</script>

<template>
  <aside class="property-panel">
    <div class="panel-title">属性配置</div>
    <div v-if="!node" class="panel-empty">
      <p>选中画布上的组件后在此配置</p>
    </div>
    <template v-else>
      <!-- 组件信息头 -->
      <div class="comp-info">
        <div class="comp-info-row">
          <span class="comp-type">{{ meta?.name ?? node.componentId }}</span>
          <span class="comp-id" :title="node.id">{{ node.id.slice(0, 8) }}</span>
        </div>
        <div v-if="!editingName" class="comp-name" @click="startEditName">
          <span>{{ node.name }}</span>
          <span class="edit-hint">点击重命名</span>
        </div>
        <el-input
          v-else
          v-model="nameInput"
          size="small"
          placeholder="组件名称"
          @blur="commitName"
          @keyup.enter="commitName"
        />
      </div>

      <!-- Tab 切换 -->
      <div class="panel-tabs">
        <el-button
          v-for="t in [
            { k: 'props', n: '属性' },
            { k: 'style', n: '样式' },
            { k: 'event', n: '事件' },
          ]"
          :key="t.k"
          class="tab-btn"
          :class="{ active: tab === t.k }"
          text
          @click="tab = t.k as typeof tab"
        >
          {{ t.n }}
        </el-button>
      </div>

      <div class="panel-body">
        <!-- 属性 Tab -->
        <div v-if="tab === 'props'" class="form-list">
          <div v-if="editor.variables.length > 0" class="var-hint">
            属性值支持 <code>&#123;&#123;变量名&#125;&#125;</code> 引用变量
          </div>
          <div v-for="field in propFields" :key="field.key" class="form-item">
            <label class="form-label">{{ field.label }}</label>
            <el-input
              v-if="field.type === 'input'"
              :model-value="String(getProp(field.key) ?? '')"
              @update:model-value="(v) => setProp(field.key, v)"
            />
            <el-input
              v-else-if="field.type === 'textarea'"
              type="textarea"
              :rows="3"
              :model-value="String(getProp(field.key) ?? '')"
              @update:model-value="(v) => setProp(field.key, v)"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              :model-value="Number(getProp(field.key) ?? 0)"
              controls-position="right"
              @update:model-value="(v) => setProp(field.key, v ?? 0)"
            />
            <el-select
              v-else-if="field.type === 'select'"
              :model-value="getProp(field.key)"
              @update:model-value="(v) => setProp(field.key, v)"
            >
              <el-option
                v-for="opt in field.options"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-switch
              v-else-if="field.type === 'switch'"
              :model-value="Boolean(getProp(field.key))"
              @update:model-value="(v) => setProp(field.key, v)"
            />
            <el-color-picker
              v-else-if="field.type === 'color'"
              :model-value="String(getProp(field.key) ?? '#ffffff')"
              @update:model-value="(v) => setProp(field.key, v ?? '#ffffff')"
            />
            <el-select
              v-if="
                (field.type === 'input' || field.type === 'textarea') && editor.variables.length > 0
              "
              v-model="propVarPicker[field.key]"
              size="small"
              placeholder="插入变量"
              class="var-insert"
              @change="(v) => insertVarToProp(field.key, String(v))"
            >
              <el-option
                v-for="v in editor.variables"
                :key="v.id"
                :label="v.name"
                :value="v.name"
              />
            </el-select>
          </div>
          <div v-if="propFields.length === 0" class="muted">该组件暂无可配置属性</div>
        </div>

        <!-- 样式 Tab：通用样式配置 -->
        <div v-else-if="tab === 'style'" class="style-list">
          <el-collapse :model-value="['spacing', 'border', 'bg', 'text', 'effect']">
            <!-- 间距 -->
            <el-collapse-item title="间距" name="spacing">
              <div class="form-item">
                <label class="form-label">内边距 (px)</label>
                <el-input-number
                  :model-value="getStyleNum('padding')"
                  controls-position="right"
                  @update:model-value="(v) => setStyleNum('padding', v)"
                />
              </div>
              <div class="form-item">
                <label class="form-label">外边距 (px)</label>
                <el-input-number
                  :model-value="getStyleNum('margin')"
                  controls-position="right"
                  @update:model-value="(v) => setStyleNum('margin', v)"
                />
              </div>
            </el-collapse-item>

            <!-- 边框 -->
            <el-collapse-item title="边框" name="border">
              <div class="form-item">
                <label class="form-label">圆角 (px)</label>
                <el-input-number
                  :model-value="getStyleNum('borderRadius')"
                  controls-position="right"
                  :min="0"
                  @update:model-value="(v) => setStyleNum('borderRadius', v)"
                />
              </div>
              <div class="form-item">
                <label class="form-label">边框宽度 (px)</label>
                <el-input-number
                  :model-value="getStyleNum('borderWidth')"
                  controls-position="right"
                  :min="0"
                  @update:model-value="(v) => setStyleNum('borderWidth', v)"
                />
              </div>
              <div class="form-item">
                <label class="form-label">边框样式</label>
                <el-select
                  :model-value="getStyle('borderStyle') || 'none'"
                  @update:model-value="(v) => setStyle('borderStyle', String(v))"
                >
                  <el-option
                    v-for="opt in borderStyleOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </div>
              <div class="form-item">
                <label class="form-label">边框颜色</label>
                <el-color-picker
                  :model-value="getStyle('borderColor') || '#e5e6eb'"
                  @update:model-value="(v) => setStyle('borderColor', v ?? '#e5e6eb')"
                />
              </div>
            </el-collapse-item>

            <!-- 背景 -->
            <el-collapse-item title="背景" name="bg">
              <div class="form-item">
                <label class="form-label">背景色</label>
                <el-color-picker
                  :model-value="getStyle('backgroundColor') || '#ffffff'"
                  @update:model-value="(v) => setStyle('backgroundColor', v ?? '#ffffff')"
                />
              </div>
            </el-collapse-item>

            <!-- 文字 -->
            <el-collapse-item title="文字" name="text">
              <div class="form-item">
                <label class="form-label">字号 (px)</label>
                <el-input-number
                  :model-value="getStyleNum('fontSize')"
                  controls-position="right"
                  :min="12"
                  @update:model-value="(v) => setStyleNum('fontSize', v)"
                />
              </div>
              <div class="form-item">
                <label class="form-label">字重</label>
                <el-select
                  :model-value="getStyle('fontWeight') || '400'"
                  @update:model-value="(v) => setStyle('fontWeight', String(v))"
                >
                  <el-option
                    v-for="opt in fontWeightOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </div>
              <div class="form-item">
                <label class="form-label">行高</label>
                <el-input-number
                  :model-value="Number(getStyle('lineHeight')) || 0"
                  controls-position="right"
                  :step="0.1"
                  :min="0"
                  @update:model-value="(v) => setStyle('lineHeight', String(v ?? 0))"
                />
              </div>
              <div class="form-item">
                <label class="form-label">文字颜色</label>
                <el-color-picker
                  :model-value="getStyle('color') || '#1f2329'"
                  @update:model-value="(v) => setStyle('color', v ?? '#1f2329')"
                />
              </div>
              <div class="form-item">
                <label class="form-label">对齐方式</label>
                <el-select
                  :model-value="getStyle('textAlign') || 'left'"
                  @update:model-value="(v) => setStyle('textAlign', String(v))"
                >
                  <el-option
                    v-for="opt in alignOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </div>
            </el-collapse-item>

            <!-- 效果 -->
            <el-collapse-item title="效果" name="effect">
              <div class="form-item">
                <label class="form-label">
                  透明度 ({{
                    Math.round((Number(getStyle('opacity') || '1') || 1) * 100)
                  }}%)
                </label>
                <el-slider
                  :model-value="(Number(getStyle('opacity') || '1') || 1) * 100"
                  :min="0"
                  :max="100"
                  @update:model-value="(v: number | number[]) => setStyle('opacity', String((Number(Array.isArray(v) ? v[0] : v) || 100) / 100))"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 事件 Tab -->
        <div v-else class="event-list">
          <div class="event-add">
            <span class="form-label">添加事件</span>
            <div class="event-buttons">
              <el-button
                v-for="ev in meta?.supportEvents ?? []"
                :key="ev"
                size="small"
                :icon="Plus"
                @click="addEvent(ev)"
              >
                {{ typeLabel[ev] }}
              </el-button>
              <span v-if="!meta?.supportEvents?.length" class="muted">该组件不支持事件</span>
            </div>
          </div>

          <el-collapse v-model="expandedEvent" class="event-collapse">
            <el-collapse-item
              v-for="(ev, idx) in events"
              :key="idx"
              :name="idx"
            >
              <template #title>
                <div class="event-header">
                  <span class="event-type-tag">{{ typeLabel[ev.type] }}</span>
                  <span class="event-action-count">{{ ev.actions.length }} 个动作</span>
                  <el-button
                    text
                    type="danger"
                    size="small"
                    class="event-del"
                    @click.stop="removeEvent(idx)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
              <EventBlock
                :event="ev"
                :index="idx"
                @update="(patch) => updateEvent(idx, patch)"
                @remove="removeEvent(idx)"
              />
            </el-collapse-item>
          </el-collapse>
          <div v-if="events.length === 0" class="muted">暂未绑定事件，点击上方按钮添加</div>
        </div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.property-panel {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 320px;
  background: var(--color-bg-1);
  border-left: 1px solid var(--color-border);
}

.panel-title {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.panel-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-size: 13px;
  color: var(--color-text-4);
  text-align: center;
}

/* 组件信息头 */
.comp-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.comp-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comp-type {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
}

.comp-id {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-4);
}

.comp-name {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-2);
  cursor: pointer;
}

.comp-name:hover .edit-hint {
  opacity: 1;
}

.edit-hint {
  font-size: 11px;
  color: var(--color-primary);
  opacity: 0;
  transition: opacity 0.2s;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  height: 40px;
  padding: 0;
  font-size: 13px;
  color: var(--color-text-2);
  border-radius: 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  font-weight: 600;
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.form-label {
  font-size: 12px;
  color: var(--color-text-2);
}

.var-hint {
  padding: 8px 10px;
  font-size: 11px;
  color: var(--color-text-3);
  background: var(--color-bg-2);
  border-radius: var(--radius-md);
}

.var-hint code {
  font-family: var(--font-mono);
  color: var(--color-primary);
}

.var-insert {
  margin-top: 2px;
}

/* 样式 Tab */
.style-list :deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
}

.style-list :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

/* 事件 Tab */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-add .event-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.event-collapse :deep(.el-collapse-item__header) {
  height: auto;
  padding: 6px 0;
}

.event-header {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.event-type-tag {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
}

.event-action-count {
  flex: 1;
  font-size: 12px;
  color: var(--color-text-3);
}

.event-del {
  margin-right: 4px;
}

.muted {
  font-size: 12px;
  color: var(--color-text-4);
}
</style>
