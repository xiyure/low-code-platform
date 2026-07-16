<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { ElMessageBox } from 'element-plus';
import {
  Plus,
  Delete,
  Connection,
  Grid,
  DataAnalysis,
  Document,
} from '@element-plus/icons-vue';
import type { DataTableColumn, DataTableConfig } from '@/types';

defineOptions({ name: 'InteractionLogic' });

const editor = useEditorStore();

// ===== 左侧导航 =====
type Section = 'workflow' | 'dataTable' | 'globalVariable';
const activeSection = ref<Section>('workflow');

const sections = [
  { key: 'workflow' as Section, name: '调用工作流', icon: Connection, desc: '配置工作流，供组件事件调用' },
  { key: 'dataTable' as Section, name: '数据表', icon: Grid, desc: '配置本地数据表，存储结构化数据' },
  { key: 'globalVariable' as Section, name: '全局变量', icon: DataAnalysis, desc: '配置跨页面共享的全局变量' },
];

const sectionTitle = computed(() => sections.find((s) => s.key === activeSection.value)?.name ?? '');

// ===== 工作流 =====
const selectedWorkflowId = ref<string>('');

async function onAddWorkflow(): Promise<void> {
  const wf = editor.addWorkflow();
  selectedWorkflowId.value = wf.id;
}

async function onRemoveWorkflow(id: string, name: string): Promise<void> {
  await ElMessageBox.confirm(`确定删除工作流「${name}」？`, '删除工作流', { type: 'warning' });
  editor.removeWorkflow(id);
  if (selectedWorkflowId.value === id) selectedWorkflowId.value = '';
}

// ===== 数据表 =====
const selectedTableId = ref<string>('');

const selectedTable = computed<DataTableConfig | null>(
  () => editor.dataTables.find((t) => t.id === selectedTableId.value) ?? null,
);

function onAddDataTable(): void {
  const t = editor.addDataTable();
  selectedTableId.value = t.id;
}

async function onRemoveDataTable(id: string, name: string): Promise<void> {
  await ElMessageBox.confirm(`确定删除数据表「${name}」？`, '删除数据表', { type: 'warning' });
  editor.removeDataTable(id);
  if (selectedTableId.value === id) selectedTableId.value = '';
}

function onAddColumn(): void {
  if (!selectedTable.value) return;
  editor.addTableColumn(selectedTable.value.id);
}

function onAddRow(): void {
  if (!selectedTable.value) return;
  editor.addTableRow(selectedTable.value.id);
}

async function onRemoveColumn(colId: string, name: string): Promise<void> {
  if (!selectedTable.value) return;
  await ElMessageBox.confirm(`确定删除列「${name}」？该列所有数据将被清除`, '删除列', {
    type: 'warning',
  });
  editor.removeTableColumn(selectedTable.value.id, colId);
}

function onRemoveRow(rowIndex: number): void {
  if (!selectedTable.value) return;
  editor.removeTableRow(selectedTable.value.id, rowIndex);
}

/** 单元格值变更时按列类型转换 */
function onCellChange(rowIndex: number, col: DataTableColumn, value: string): void {
  if (!selectedTable.value) return;
  let val: string | number | boolean = value;
  if (col.type === 'number') val = Number(value) || 0;
  else if (col.type === 'boolean') val = value === 'true';
  editor.updateTableCell(selectedTable.value.id, rowIndex, col.id, val);
}

/** el-input-number 的 change 回调兼容（值可能为 undefined） */
function onNumberCellChange(rowIndex: number, col: DataTableColumn, v: number | undefined): void {
  onCellChange(rowIndex, col, String(v ?? 0));
}

/** 列类型选项 */
const columnTypeOptions = [
  { label: '文本', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
];

// ===== 全局变量 =====
const varTypeOptions = [
  { label: '文本', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
];

function onAddGlobalVar(): void {
  editor.addGlobalVariable();
}

function onRemoveGlobalVar(id: string, name: string): void {
  ElMessageBox.confirm(`确定删除全局变量「${name}」？`, '删除变量', { type: 'warning' })
    .then(() => editor.removeGlobalVariable(id))
    .catch(() => {});
}
</script>

<template>
  <div class="interaction-logic">
    <!-- 左侧导航 -->
    <aside class="logic-sidebar">
      <div
        v-for="sec in sections"
        :key="sec.key"
        class="nav-item"
        :class="{ active: activeSection === sec.key }"
        @click="activeSection = sec.key"
      >
        <el-icon class="nav-icon"><component :is="sec.icon" /></el-icon>
        <div class="nav-text">
          <div class="nav-name">{{ sec.name }}</div>
          <div class="nav-desc">{{ sec.desc }}</div>
        </div>
      </div>
    </aside>

    <!-- 右侧编辑区 -->
    <main class="logic-main">
      <!-- ===== 调用工作流 ===== -->
      <template v-if="activeSection === 'workflow'">
        <header class="section-header">
          <h3 class="section-title">{{ sectionTitle }}</h3>
          <el-button type="primary" :icon="Plus" size="small" @click="onAddWorkflow">
            新建工作流
          </el-button>
        </header>

        <div v-if="editor.workflows.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Connection /></el-icon>
          <p>暂无工作流</p>
          <p class="empty-sub">新建工作流后，可在组件事件中调用</p>
        </div>

        <div v-else class="list-content">
          <div
            v-for="wf in editor.workflows"
            :key="wf.id"
            class="list-card"
            :class="{ active: selectedWorkflowId === wf.id }"
            @click="selectedWorkflowId = wf.id"
          >
            <div v-if="selectedWorkflowId !== wf.id" class="card-summary">
              <el-icon class="card-icon"><Connection /></el-icon>
              <div class="card-info">
                <div class="card-name">{{ wf.name }}</div>
                <div class="card-desc">{{ wf.description || '暂无描述' }}</div>
              </div>
              <el-button
                class="card-delete"
                text
                size="small"
                :icon="Delete"
                @click.stop="onRemoveWorkflow(wf.id, wf.name)"
              />
            </div>
            <div v-else class="card-detail">
              <div class="detail-row">
                <label class="detail-label">名称</label>
                <el-input
                  :model-value="wf.name"
                  placeholder="工作流名称"
                  @update:model-value="(v: string) => editor.updateWorkflow(wf.id, { name: v })"
                />
              </div>
              <div class="detail-row">
                <label class="detail-label">描述</label>
                <el-input
                  :model-value="wf.description ?? ''"
                  placeholder="工作流描述"
                  @update:model-value="(v: string) => editor.updateWorkflow(wf.id, { description: v })"
                />
              </div>
              <div class="detail-row">
                <label class="detail-label">输入参数</label>
                <el-input
                  :model-value="wf.inputParams ?? ''"
                  type="textarea"
                  :rows="3"
                  placeholder='JSON 格式，如 {"key": "value"}（后续开发）'
                  @update:model-value="(v: string) => editor.updateWorkflow(wf.id, { inputParams: v })"
                />
              </div>
              <div class="detail-actions">
                <el-button size="small" @click="selectedWorkflowId = ''">收起</el-button>
                <el-button size="small" type="danger" plain :icon="Delete" @click="onRemoveWorkflow(wf.id, wf.name)">
                  删除
                </el-button>
              </div>
              <div class="detail-tip">工作流编辑功能开发中，当前仅保存配置信息</div>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== 数据表 ===== -->
      <template v-if="activeSection === 'dataTable'">
        <header class="section-header">
          <h3 class="section-title">{{ sectionTitle }}</h3>
          <el-button type="primary" :icon="Plus" size="small" @click="onAddDataTable">
            新建数据表
          </el-button>
        </header>

        <div v-if="editor.dataTables.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Grid /></el-icon>
          <p>暂无数据表</p>
          <p class="empty-sub">新建数据表以存储结构化数据</p>
        </div>

        <div v-else class="table-content">
          <!-- 数据表列表 -->
          <div class="table-tabs">
            <div
              v-for="t in editor.dataTables"
              :key="t.id"
              class="table-tab"
              :class="{ active: selectedTableId === t.id }"
              @click="selectedTableId = t.id"
            >
              <el-icon class="tab-icon"><Grid /></el-icon>
              <span class="tab-name">{{ t.name }}</span>
              <span class="tab-count">{{ t.rows.length }}</span>
              <el-button
                class="tab-delete"
                text
                size="small"
                :icon="Delete"
                @click.stop="onRemoveDataTable(t.id, t.name)"
              />
            </div>
          </div>

          <!-- 选中表的编辑区 -->
          <div v-if="selectedTable" class="table-editor">
            <div class="table-meta">
              <label class="detail-label">表名</label>
              <el-input
                :model-value="selectedTable.name"
                style="width: 240px"
                @update:model-value="(v: string) => editor.updateDataTable(selectedTable!.id, { name: v })"
              />
              <span class="meta-info">{{ selectedTable.columns.length }} 列 · {{ selectedTable.rows.length }} 行</span>
            </div>

            <!-- 列定义区 -->
            <div class="columns-section">
              <div class="columns-header">
                <span class="columns-title">列定义</span>
                <el-button :icon="Plus" size="small" @click="onAddColumn">新增列</el-button>
              </div>
              <div class="columns-list">
                <div v-for="col in selectedTable.columns" :key="col.id" class="column-row">
                  <el-input
                    :model-value="col.name"
                    placeholder="列名"
                    style="width: 160px"
                    @update:model-value="(v: string) => editor.updateTableColumn(selectedTable!.id, col.id, { name: v })"
                  />
                  <el-select
                    :model-value="col.type"
                    style="width: 100px"
                    @update:model-value="(v: string) => editor.updateTableColumn(selectedTable!.id, col.id, { type: v as DataTableColumn['type'] })"
                  >
                    <el-option v-for="opt in columnTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                  <el-button
                    text
                    size="small"
                    type="danger"
                    :icon="Delete"
                    @click="onRemoveColumn(col.id, col.name)"
                  />
                </div>
              </div>
            </div>

            <!-- 数据行区 -->
            <div class="rows-section">
              <div class="rows-header">
                <span class="rows-title">数据</span>
                <el-button :icon="Plus" size="small" @click="onAddRow">新增行</el-button>
              </div>
              <div v-if="selectedTable.columns.length === 0" class="rows-empty">
                请先添加列
              </div>
              <div v-else-if="selectedTable.rows.length === 0" class="rows-empty">
                暂无数据，点击「新增行」添加
              </div>
              <el-table v-else :data="selectedTable.rows" border size="small" class="data-table">
                <el-table-column type="index" label="#" width="48" />
                <el-table-column
                  v-for="col in selectedTable.columns"
                  :key="col.id"
                  :label="col.name"
                  min-width="140"
                >
                  <template #default="{ row, $index }">
                    <el-switch
                      v-if="col.type === 'boolean'"
                      :model-value="row[col.id] === true"
                      @change="(v: string | number | boolean) => onCellChange($index, col, String(v))"
                    />
                    <el-input-number
                      v-else-if="col.type === 'number'"
                      :model-value="row[col.id] as number"
                      :controls="false"
                      style="width: 100%"
                      @change="(v: number | undefined) => onNumberCellChange($index, col, v)"
                    />
                    <el-input
                      v-else
                      :model-value="String(row[col.id] ?? '')"
                      @update:model-value="(v: string) => onCellChange($index, col, v)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="70" fixed="right">
                  <template #default="{ $index }">
                    <el-button text size="small" type="danger" :icon="Delete" @click="onRemoveRow($index)" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <div v-else class="empty-state small">
            <p>请在左侧选择一个数据表进行编辑</p>
          </div>
        </div>
      </template>

      <!-- ===== 全局变量 ===== -->
      <template v-if="activeSection === 'globalVariable'">
        <header class="section-header">
          <h3 class="section-title">{{ sectionTitle }}</h3>
          <el-button type="primary" :icon="Plus" size="small" @click="onAddGlobalVar">
            新建变量
          </el-button>
        </header>

        <div class="var-tip">
          <el-icon><Document /></el-icon>
          <span>全局变量可在所有页面的组件属性中使用，引用方式：<code v-pre>{{变量名}}</code></span>
        </div>

        <div v-if="editor.globalVariables.length === 0" class="empty-state">
          <el-icon class="empty-icon"><DataAnalysis /></el-icon>
          <p>暂无全局变量</p>
          <p class="empty-sub">新建全局变量后，可在组件属性中通过 <code v-pre>{{变量名}}</code> 引用</p>
        </div>

        <div v-else class="var-list">
          <div class="var-header-row">
            <span class="var-col-name">变量名</span>
            <span class="var-col-type">类型</span>
            <span class="var-col-default">默认值</span>
            <span class="var-col-action">操作</span>
          </div>
          <div v-for="v in editor.globalVariables" :key="v.id" class="var-row">
            <el-input
              :model-value="v.name"
              class="var-col-name"
              placeholder="变量名"
              @update:model-value="(val: string) => editor.updateGlobalVariable(v.id, { name: val })"
            />
            <el-select
              :model-value="v.type"
              class="var-col-type"
              @update:model-value="(val: string) => editor.updateGlobalVariable(v.id, { type: val as 'string' | 'number' | 'boolean' })"
            >
              <el-option v-for="opt in varTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-switch
              v-if="v.type === 'boolean'"
              :model-value="v.defaultValue === true"
              class="var-col-default"
              @change="(val: string | number | boolean) => editor.updateGlobalVariable(v.id, { defaultValue: val })"
            />
            <el-input-number
              v-else-if="v.type === 'number'"
              :model-value="v.defaultValue as number"
              :controls="false"
              class="var-col-default"
              @change="(val: number | undefined) => editor.updateGlobalVariable(v.id, { defaultValue: val ?? 0 })"
            />
            <el-input
              v-else
              :model-value="String(v.defaultValue ?? '')"
              class="var-col-default"
              placeholder="默认值"
              @update:model-value="(val: string) => editor.updateGlobalVariable(v.id, { defaultValue: val })"
            />
            <el-button
              class="var-col-action"
              text
              size="small"
              type="danger"
              :icon="Delete"
              @click="onRemoveGlobalVar(v.id, v.name)"
            />
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.interaction-logic {
  display: flex;
  flex: 1;
  overflow: hidden;

  .logic-sidebar {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: 4px;
    width: 240px;
    padding: 16px 12px;
    background: var(--color-bg-1);
    border-right: 1px solid var(--color-border);

    .nav-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 12px;
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: background 0.15s;

      &:hover {
        background: var(--color-bg-2);
      }

      &.active {
        background: var(--color-primary-light);

        .nav-icon,
        .nav-name {
          color: var(--color-primary);
        }
      }

      .nav-icon {
        flex-shrink: 0;
        margin-top: 2px;
        font-size: 18px;
        color: var(--color-text-3);
      }

      .nav-text {
        flex: 1;
        min-width: 0;

        .nav-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
        }

        .nav-desc {
          margin-top: 2px;
          font-size: 12px;
          line-height: 1.4;
          color: var(--color-text-3);
        }
      }
    }
  }

  .logic-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 24px;
    overflow-y: auto;

    .section-header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-4);

  &.small {
    padding: 60px 0;
    font-size: 14px;
  }

  .empty-icon {
    margin-bottom: 8px;
    font-size: 40px;
  }

  .empty-sub {
    margin-top: 4px;
    font-size: 12px;
  }
}

/* 工作流列表 */
.list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .list-card {
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: border-color 0.15s;

    &:hover {
      border-color: var(--color-primary);
    }

    &.active {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .card-summary {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      cursor: pointer;

      .card-icon {
        flex-shrink: 0;
        font-size: 20px;
        color: var(--color-primary);
      }

      .card-info {
        flex: 1;
        min-width: 0;

        .card-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
        }

        .card-desc {
          margin-top: 2px;
          font-size: 12px;
          color: var(--color-text-3);
        }
      }

      .card-delete {
        flex-shrink: 0;
        color: var(--color-text-3);

        &:hover {
          color: var(--color-danger);
        }
      }
    }

    .card-detail {
      padding: 16px;

      .detail-row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;

        .detail-label {
          flex-shrink: 0;
          width: 60px;
          font-size: 13px;
          color: var(--color-text-2);
        }
      }

      .detail-actions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }

      .detail-tip {
        margin-top: 12px;
        padding: 8px 12px;
        font-size: 12px;
        color: var(--color-text-3);
        background: var(--color-bg-2);
        border-radius: var(--radius-sm);
      }
    }
  }
}

/* 数据表 */
.table-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;

  .table-tabs {
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;

    .table-tab {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 6px 12px;
      cursor: pointer;
      background: var(--color-bg-1);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      transition: all 0.15s;

      &:hover {
        border-color: var(--color-primary);
      }

      &.active {
        color: var(--color-primary);
        background: var(--color-primary-light);
        border-color: var(--color-primary);

        .tab-icon {
          color: var(--color-primary);
        }
      }

      .tab-icon {
        font-size: 14px;
        color: var(--color-text-3);
      }

      .tab-name {
        font-size: 13px;
      }

      .tab-count {
        padding: 0 6px;
        font-size: 12px;
        color: var(--color-text-3);
        background: var(--color-bg-2);
        border-radius: 10px;
      }

      .tab-delete {
        padding: 0;
        color: var(--color-text-3);

        &:hover {
          color: var(--color-danger);
        }
      }
    }
  }

  .table-editor {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .table-meta {
      display: flex;
      gap: 12px;
      align-items: center;

      .meta-info {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }

    .columns-section {
      .columns-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .columns-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-2);
        }
      }

      .columns-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .column-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
      }
    }

    .rows-section {
      .rows-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .rows-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-2);
        }
      }

      .rows-empty {
        padding: 32px 0;
        font-size: 13px;
        color: var(--color-text-4);
        text-align: center;
        background: var(--color-bg-2);
        border-radius: var(--radius-md);
      }

      .data-table {
        width: 100%;
      }
    }
  }
}

/* 全局变量 */
.var-tip {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--color-text-2);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);

  code {
    padding: 1px 5px;
    font-family: var(--font-mono);
    color: var(--color-primary);
    background: var(--color-bg-1);
    border-radius: 3px;
  }
}

.var-list {
  .var-header-row,
  .var-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .var-header-row {
    padding: 0 0 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-3);
  }

  .var-row {
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border-light);

    &:last-child {
      border-bottom: none;
    }
  }

  .var-col-name {
    width: 200px;
  }

  .var-col-type {
    width: 120px;
  }

  .var-col-default {
    flex: 1;
  }

  .var-col-action {
    flex-shrink: 0;
  }
}
</style>
