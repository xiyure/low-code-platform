<script setup lang="ts">
import { useEditorStore } from '@/store/editorStore';
import { Delete, Plus } from '@element-plus/icons-vue';
import type { Variable } from '@/types';

defineProps<{ modelValue: boolean }>();
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const editor = useEditorStore();

const typeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
];

function onAdd(): void {
  editor.addVariable();
}

function onUpdate(id: string, patch: Partial<Variable>): void {
  editor.updateVariable(id, patch);
}

function onRemove(id: string): void {
  editor.removeVariable(id);
}

/** 类型变更时同步默认值类型 */
function onTypeChange(v: Variable, type: Variable['type']): void {
  let defaultValue: string | number | boolean = '';
  if (type === 'number') defaultValue = 0;
  else if (type === 'boolean') defaultValue = false;
  editor.updateVariable(v.id, { type, defaultValue });
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="页面变量"
    direction="rtl"
    size="420px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="var-drawer">
      <div class="var-tip">
        变量可在组件属性中通过 <code>&#123;&#123;变量名&#125;&#125;</code> 引用，预览时会实时替换。
      </div>

      <el-button type="primary" :icon="Plus" plain class="add-btn" @click="onAdd">
        新增变量
      </el-button>

      <div v-if="editor.variables.length === 0" class="var-empty">暂无变量，点击上方按钮新增</div>

      <div v-else class="var-list">
        <div v-for="v in editor.variables" :key="v.id" class="var-item">
          <div class="var-row">
            <el-input
              :model-value="v.name"
              size="small"
              placeholder="变量名"
              class="var-name"
              @update:model-value="(val) => onUpdate(v.id, { name: String(val) })"
            />
            <el-select
              :model-value="v.type"
              size="small"
              class="var-type"
              @update:model-value="(val) => onTypeChange(v, val as Variable['type'])"
            >
              <el-option
                v-for="opt in typeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button type="danger" :icon="Delete" size="small" circle @click="onRemove(v.id)" />
          </div>
          <div class="var-row">
            <label class="var-label">默认值</label>
            <el-input
              v-if="v.type === 'string'"
              :model-value="String(v.defaultValue)"
              size="small"
              placeholder="默认值"
              @update:model-value="(val) => onUpdate(v.id, { defaultValue: String(val) })"
            />
            <el-input-number
              v-else-if="v.type === 'number'"
              :model-value="Number(v.defaultValue)"
              size="small"
              controls-position="right"
              class="var-num"
              @update:model-value="(val) => onUpdate(v.id, { defaultValue: Number(val ?? 0) })"
            />
            <el-switch
              v-else
              :model-value="Boolean(v.defaultValue)"
              @update:model-value="(val) => onUpdate(v.id, { defaultValue: Boolean(val) })"
            />
          </div>
          <div class="var-row">
            <el-input
              :model-value="v.description ?? ''"
              size="small"
              placeholder="描述（可选）"
              @update:model-value="(val) => onUpdate(v.id, { description: String(val) })"
            />
          </div>
          <div class="var-ref">引用：&#123;&#123;{{ v.name }}&#125;&#125;</div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.var-drawer {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .var-tip {
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-text-3);
    background: var(--color-bg-2);
    border-radius: var(--radius-md);

    code {
      padding: 1px 4px;
      font-family: var(--font-mono);
      color: var(--color-primary);
      background: var(--color-primary-light);
      border-radius: 4px;
    }
  }

  .add-btn {
    align-self: flex-start;
  }

  .var-empty {
    padding: 40px 0;
    font-size: 13px;
    color: var(--color-text-4);
    text-align: center;
  }

  .var-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .var-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--color-bg-2);
      border-radius: var(--radius-md);

      .var-row {
        display: flex;
        gap: 8px;
        align-items: center;

        .var-name {
          flex: 1;
        }

        .var-type {
          width: 110px;
        }

        .var-num {
          flex: 1;
        }

        .var-label {
          flex-shrink: 0;
          width: 56px;
          font-size: 12px;
          color: var(--color-text-3);
        }
      }

      .var-ref {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--color-primary);
      }
    }
  }
}
</style>
