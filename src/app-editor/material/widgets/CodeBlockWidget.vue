<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
}>();

const codeText = computed(() => props.code ?? "function hello() {\n  console.log('Hello, World!');\n}");

const lang = computed(() => props.language ?? 'javascript');

const lines = computed(() => codeText.value.split('\n'));
</script>

<template>
  <div class="mat-codeblock">
    <div class="codeblock-header">
      <span class="code-lang">{{ lang }}</span>
    </div>
    <pre class="codeblock-pre"><ol v-if="showLineNumbers" class="line-numbers"><li v-for="(_, i) in lines" :key="i">{{ i + 1 }}</li></ol><code :class="`language-${lang}`">{{ codeText }}</code></pre>
  </div>
</template>

<style scoped lang="scss">
.mat-codeblock {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.codeblock-header {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border);
}

.code-lang {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-3);
  text-transform: uppercase;
}

.codeblock-pre {
  display: flex;
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-1);
  background: var(--color-bg-2);
}

.line-numbers {
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  padding-right: 12px;
  margin-right: 12px;
  list-style: none;
  text-align: right;
  color: var(--color-text-4);
  border-right: 1px solid var(--color-border);

  li {
    font-family: var(--font-mono);
  }
}

code {
  flex: 1;
  font-family: var(--font-mono);
  white-space: pre;
}
</style>
