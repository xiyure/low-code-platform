<script setup lang="ts">
import { computed, ref, markRaw, type Component } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { materialRegistry } from '@/app-editor/material/registry';
import { Plus, Delete as DeleteIcon } from '@element-plus/icons-vue';
import * as Icons from '@element-plus/icons-vue';
import type { ComponentEvent, PropertyField } from '@/types';
import EventBlock from './EventBlock.vue';

const editor = useEditorStore();

/** iconPicker 常用图标候选（点击直接套用） */
const iconCandidates: string[] = [
  'Search',
  'Plus',
  'Delete',
  'Edit',
  'EditPen',
  'Setting',
  'Tools',
  'Operation',
  'Star',
  'StarFilled',
  'User',
  'Lock',
  'View',
  'Refresh',
  'Download',
  'Upload',
  'Picture',
  'Document',
  'Calendar',
  'Clock',
  'Message',
  'Phone',
  'Location',
  'Bell',
  'Filter',
  'Sort',
  'ArrowDown',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'Check',
  'Close',
  'Warning',
  'InfoFilled',
  'CircleCheck',
  'SuccessFilled',
  'WarningFilled',
  'CircleClose',
  'ErrorFilled',
  'More',
  'MoreFilled',
  'Menu',
  'Grid',
  'Tickets',
  'Pointer',
  'Histogram',
  'Link',
  'Switch',
  'Minus',
  'ChatDotRound',
];

/** 解析图标名 → 组件（找不到返回 undefined） */
function resolveIcon(name: string): Component | undefined {
  if (!name) return undefined;
  const comp = (Icons as Record<string, Component>)[name];
  return comp ? markRaw(comp) : undefined;
}

/** optionsEditor 数据操作 */
interface OptionItem {
  label: string;
  value: string;
}

function getOptions(key: string): OptionItem[] {
  const v = getProp(key);
  return Array.isArray(v) ? (v as OptionItem[]) : [];
}
function addOption(key: string): void {
  const list = [...getOptions(key)];
  const idx = list.length + 1;
  list.push({ label: `选项${idx}`, value: String(idx) });
  setProp(key, list);
}
function removeOption(key: string, idx: number): void {
  setProp(
    key,
    getOptions(key).filter((_, i) => i !== idx),
  );
}
function updateOption(key: string, idx: number, patch: Partial<OptionItem>): void {
  setProp(
    key,
    getOptions(key).map((o, i) => (i === idx ? { ...o, ...patch } : o)),
  );
}

// ===== itemsEditor 数据操作（可视化编辑列表/标签页/折叠面板等的数据） =====
interface ItemRow {
  text?: string;
  [k: string]: string | number | undefined;
}

/** 获取 itemsEditor 的行数据（统一转为行对象数组） */
function getItemRows(field: PropertyField): ItemRow[] {
  const v = node.value?.props[field.key];
  const format = field.itemFormat ?? 'array';

  if (format === 'text') {
    // text 格式：换行分隔的字符串或字符串数组
    if (Array.isArray(v)) return (v as string[]).map((text) => ({ text }));
    if (typeof v === 'string') return v.split('\n').filter(Boolean).map((text) => ({ text }));
    return [];
  }

  // array 格式：对象数组（可能是 JSON 字符串）
  if (Array.isArray(v)) return v as ItemRow[];
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed as ItemRow[];
    } catch {
      // 解析失败
    }
  }
  return [];
}

/** 将行数据写回 props（按 format 决定存储格式） */
function setItemRows(field: PropertyField, rows: ItemRow[]): void {
  const format = field.itemFormat ?? 'array';
  if (format === 'text') {
    setProp(field.key, rows.map((r) => r.text ?? '').join('\n'));
  } else {
    setProp(field.key, JSON.stringify(rows));
  }
}

function addItemRow(field: PropertyField): void {
  const rows = [...getItemRows(field)];
  const newRow: ItemRow = {};
  for (const f of field.itemFields ?? []) {
    newRow[f.key] = f.type === 'number' ? 0 : '';
  }
  rows.push(newRow);
  setItemRows(field, rows);
}

function removeItemRow(field: PropertyField, idx: number): void {
  setItemRows(field, getItemRows(field).filter((_, i) => i !== idx));
}

function updateItemRow(field: PropertyField, idx: number, key: string, value: string | number): void {
  const rows = getItemRows(field).map((r, i) => (i === idx ? { ...r, [key]: value } : r));
  setItemRows(field, rows);
}

const node = computed(() => editor.selectedNode);
const meta = computed(() => (node.value ? materialRegistry[node.value.componentId] : null));

/** 属性字段（group=props 或无 group） */
const propFields = computed<PropertyField[]>(() =>
  (meta.value?.propertySchema ?? []).filter((f) => !f.group || f.group === 'props'),
);
/** 当前组件在属性 Tab 是否有 color 字段（有则样式 Tab 不重复显示文字颜色，避免两套 color 冲突） */
const hasPropColor = computed(() =>
  propFields.value.some((f) => f.key === 'color' && f.type === 'color'),
);
const events = computed<ComponentEvent[]>(() => node.value?.events ?? []);

const tab = ref<'props' | 'style' | 'event'>('props');

// ===== 属性读写 =====
function getProp(key: string): string | number | boolean | undefined {
  const v = node.value?.props[key];
  return v as string | number | boolean | undefined;
}
/** 获取属性显示值：数组/对象自动转 JSON 字符串 */
function getPropDisplay(key: string): string {
  const v = node.value?.props[key];
  if (v === undefined || v === null) return '';
  if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
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
  load: '加载时',
  click: '点击时',
  doubleClick: '双击时',
  mouseEnter: '鼠标移入时',
  mouseLeave: '鼠标移出时',
  submit: '提交时',
  focus: '聚焦时',
  blur: '失焦时',
  change: '值变化时',
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

      <el-scrollbar class="panel-scroll">
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
              :model-value="getPropDisplay(field.key)"
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
              :model-value="getProp(field.key) as string"
              @update:model-value="(v: string | null) => setProp(field.key, v || undefined)"
            />
            <el-slider
              v-else-if="field.type === 'slider'"
              :model-value="Number(getProp(field.key) ?? field.default ?? 0)"
              :min="field.min ?? 0"
              :max="field.max ?? 100"
              :step="field.step ?? 1"
              @update:model-value="
                (v: number | number[]) => setProp(field.key, Array.isArray(v) ? v[0] : v)
              "
            />
            <!-- 图标选择器：文本输入 + 实时预览 + 常用图标快捷选择 -->
            <div v-else-if="field.type === 'iconPicker'" class="icon-picker">
              <div class="icon-picker-row">
                <el-input
                  :model-value="String(getProp(field.key) ?? '')"
                  placeholder="图标名（PascalCase）"
                  @update:model-value="(v) => setProp(field.key, v)"
                />
                <div class="icon-preview">
                  <el-icon v-if="resolveIcon(String(getProp(field.key) ?? ''))">
                    <component :is="resolveIcon(String(getProp(field.key) ?? ''))" />
                  </el-icon>
                  <span v-else class="icon-preview-empty">无</span>
                </div>
              </div>
              <el-scrollbar class="icon-candidates-scroll">
                <div class="icon-candidates">
                  <el-tooltip
                    v-for="name in iconCandidates"
                    :key="name"
                    :content="name"
                    placement="top"
                  >
                    <el-button
                      circle
                      size="small"
                      class="icon-candidate"
                      :class="{ active: String(getProp(field.key)) === name }"
                      @click="setProp(field.key, name)"
                    >
                      <el-icon><component :is="resolveIcon(name)" /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </el-scrollbar>
            </div>
            <!-- 选项编辑器：增删改 label/value -->
            <div v-else-if="field.type === 'optionsEditor'" class="options-editor">
              <div v-for="(opt, idx) in getOptions(field.key)" :key="idx" class="option-row">
                <el-input
                  :model-value="opt.label"
                  size="small"
                  placeholder="显示名"
                  @update:model-value="(v) => updateOption(field.key, idx, { label: v })"
                />
                <el-input
                  :model-value="opt.value"
                  size="small"
                  placeholder="值"
                  @update:model-value="(v) => updateOption(field.key, idx, { value: v })"
                />
                <el-button
                  size="small"
                  circle
                  :icon="DeleteIcon"
                  @click="removeOption(field.key, idx)"
                />
              </div>
              <el-button size="small" :icon="Plus" plain @click="addOption(field.key)">
                添加选项
              </el-button>
            </div>
            <!-- itemsEditor：可视化编辑列表/标签页/折叠面板等的数据项 -->
            <div v-else-if="field.type === 'itemsEditor'" class="items-editor">
              <div
                v-for="(row, idx) in getItemRows(field)"
                :key="idx"
                class="item-row"
              >
                <div class="item-row-index">{{ idx + 1 }}</div>
                <div class="item-row-fields">
                  <div
                    v-for="f in field.itemFields"
                    :key="f.key"
                    class="item-field"
                  >
                    <label class="item-field-label">{{ f.label }}</label>
                    <el-input
                      v-if="f.type === 'input' || !f.type"
                      :model-value="String(row[f.key] ?? '')"
                      size="small"
                      @update:model-value="(v) => updateItemRow(field, idx, f.key, v)"
                    />
                    <el-input-number
                      v-else-if="f.type === 'number'"
                      :model-value="Number(row[f.key] ?? 0)"
                      size="small"
                      controls-position="right"
                      @update:model-value="(v) => updateItemRow(field, idx, f.key, v ?? 0)"
                    />
                    <el-color-picker
                      v-else-if="f.type === 'color'"
                      :model-value="String(row[f.key] ?? '')"
                      size="small"
                      @update:model-value="(v) => (row[f.key] = v ?? '')"
                    />
                    <el-input
                      v-else-if="f.type === 'iconPicker'"
                      :model-value="String(row[f.key] ?? '')"
                      size="small"
                      placeholder="图标名"
                      @update:model-value="(v) => updateItemRow(field, idx, f.key, v)"
                    />
                  </div>
                </div>
                <el-button
                  size="small"
                  circle
                  :icon="DeleteIcon"
                  class="item-row-del"
                  @click="removeItemRow(field, idx)"
                />
              </div>
              <el-button size="small" :icon="Plus" plain @click="addItemRow(field)">
                添加数据项
              </el-button>
            </div>
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
                  :model-value="getStyle('borderColor')"
                  @update:model-value="(v: string | null) => setStyle('borderColor', v || '')"
                />
              </div>
            </el-collapse-item>

            <!-- 背景 -->
            <el-collapse-item title="背景" name="bg">
              <div class="form-item">
                <label class="form-label">背景色</label>
                <el-color-picker
                  :model-value="getStyle('backgroundColor')"
                  @update:model-value="(v: string | null) => setStyle('backgroundColor', v || '')"
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
              <div v-if="!hasPropColor" class="form-item">
                <label class="form-label">文字颜色</label>
                <el-color-picker
                  :model-value="getStyle('color')"
                  @update:model-value="(v: string | null) => setStyle('color', v || '')"
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
                  透明度 ({{ Math.round((Number(getStyle('opacity') || '1') || 1) * 100) }}%)
                </label>
                <el-slider
                  :model-value="(Number(getStyle('opacity') || '1') || 1) * 100"
                  :min="0"
                  :max="100"
                  @update:model-value="
                    (v: number | number[]) =>
                      setStyle(
                        'opacity',
                        String((Number(Array.isArray(v) ? v[0] : v) || 100) / 100),
                      )
                  "
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
            <el-collapse-item v-for="(ev, idx) in events" :key="idx" :name="idx">
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
      </el-scrollbar>
    </template>
  </aside>
</template>

<style scoped lang="scss">
.property-panel {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 320px;
  background: var(--color-bg-1);
  border-left: 1px solid var(--color-border);

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

    &-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
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

    &:hover .edit-hint {
      opacity: 1;
    }

    .edit-hint {
      font-size: 11px;
      color: var(--color-primary);
      opacity: 0;
      transition: opacity 0.2s;
    }
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

    &.active {
      font-weight: 600;
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }
  }

  .panel-scroll {
    flex: 1;
    height: 0;
  }

  .panel-body {
    padding: 12px 16px;

    .form-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .var-hint {
        padding: 8px 10px;
        font-size: 11px;
        color: var(--color-text-3);
        background: var(--color-bg-2);
        border-radius: var(--radius-md);

        code {
          font-family: var(--font-mono);
          color: var(--color-primary);
        }
      }

      .form-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .form-label {
          font-size: 12px;
          color: var(--color-text-2);
        }

        .var-insert {
          margin-top: 2px;
        }
      }
    }

    /* 样式 Tab */
    .style-list {
      :deep(.el-collapse-item__header) {
        height: 34px;
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-1);
      }

      :deep(.el-collapse-item__content) {
        padding: 8px 0 12px;
      }

      /* 样式项：水平布局（label 左侧固定宽度，控件右侧填充） */
      .form-item {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;

        .form-label {
          flex-shrink: 0;
          width: 72px;
          font-size: 12px;
          color: var(--color-text-3);
          text-align: right;
        }

        /* 颜色选择器等小型控件靠左对齐 */
        .el-color-picker {
          flex-shrink: 0;
        }

        /* 滑块撑满剩余空间 */
        .el-slider {
          flex: 1;
        }
      }
    }

    /* 事件 Tab */
    .event-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .event-add {
        .event-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
      }

      .event-collapse {
        :deep(.el-collapse-item__header) {
          height: auto;
          padding: 6px 0;
        }
      }

      .event-header {
        display: flex;
        flex: 1;
        gap: 8px;
        align-items: center;
        justify-content: space-between;

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
      }
    }

    .muted {
      font-size: 12px;
      color: var(--color-text-4);
    }

    /* 图标选择器 */
    .icon-picker {
      display: flex;
      flex-direction: column;
      gap: 8px;

      &-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .icon-preview {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        font-size: 18px;
        color: var(--color-text-1);
        background: var(--color-bg-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);

        &-empty {
          font-size: 11px;
          color: var(--color-text-4);
        }
      }

      .icon-candidates-scroll {
        max-height: 180px;
        background: var(--color-bg-2);
        border-radius: var(--radius-md);

        .icon-candidates {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          padding: 6px;

          .icon-candidate {
            width: 28px;
            height: 28px;
            padding: 0;
            font-size: 14px;
            color: var(--color-text-2);

            &.active {
              color: var(--color-primary);
              background: var(--color-primary-light);
            }
          }
        }
      }
    }

    /* 选项编辑器 */
    .options-editor {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .option-row {
        display: flex;
        gap: 6px;
        align-items: center;
      }
    }

    /* 数据项编辑器 */
    .items-editor {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .item-row {
        display: flex;
        gap: 6px;
        padding: 8px;
        background: var(--color-bg-2);
        border-radius: var(--radius-sm);

        .item-row-index {
          display: flex;
          flex-shrink: 0;
          align-items: flex-start;
          justify-content: center;
          width: 18px;
          height: 18px;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-3);
          background: var(--color-bg-3);
          border-radius: 50%;
        }

        .item-row-fields {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 6px;

          .item-field {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .item-field-label {
              font-size: 11px;
              color: var(--color-text-3);
            }
          }
        }

        .item-row-del {
          flex-shrink: 0;
          margin-top: 4px;
        }
      }
    }
  }
}
</style>
