<script setup lang="ts">
import { ref } from 'vue';
import type { UploadUserFile } from 'element-plus';

defineProps<{
  label?: string;
  disabled?: boolean;
  multiple?: boolean;
  limit?: number;
  accept?: string;
  listType?: string;
}>();

const fileList = ref<UploadUserFile[]>([]);

defineExpose({
  getValue: () => fileList.value.map((f) => f.name),
  setValue: (v: UploadUserFile[]) => {
    fileList.value = v;
  },
});
</script>

<template>
  <div class="mat-upload">
    <label v-if="label" class="field-label">{{ label }}</label>
    <el-upload
      v-model:file-list="fileList"
      action=""
      :auto-upload="false"
      :multiple="multiple"
      :limit="limit"
      :accept="accept"
      :list-type="(listType ?? 'text') as any"
      :disabled="disabled"
    >
      <span v-if="listType === 'picture-card'">点击上传</span>
      <el-button v-else type="primary">点击上传</el-button>
    </el-upload>
  </div>
</template>

<style scoped lang="scss">
.mat-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.field-label {
  font-size: 13px;
  color: var(--color-text-2);
}
</style>
