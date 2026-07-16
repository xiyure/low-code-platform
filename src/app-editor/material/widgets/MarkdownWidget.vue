<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  content?: string;
}>();

/**
 * 极简 Markdown 渲染器：支持标题(#/##/###)、粗体、斜体、链接、无序列表、有序列表、行内代码、代码块、引用、分割线
 * 不引入第三方库，仅做基础语法替换
 */
const html = computed(() => {
  const raw = props.content ?? '# 标题\n\n这是一段 **Markdown** 文本，支持 `行内代码` 和 [链接](https://example.com)。\n\n- 列表项一\n- 列表项二\n\n> 引用文本';
  return renderMarkdown(raw);
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let s = escapeHtml(text);
  // 行内代码
  s = s.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
  // 粗体
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 斜体
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // 链接
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function renderMarkdown(src: string): string {
  const lines = src.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;
  let inCode = false;
  let codeBuffer: string[] = [];

  for (const line of lines) {
    // 代码块
    if (line.trim().startsWith('```')) {
      if (inCode) {
        out.push(`<pre class="md-code-block"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // 引用
    if (line.startsWith('> ')) {
      if (!inQuote) { out.push('<blockquote class="md-quote">'); inQuote = true; }
      out.push(`<p>${renderInline(line.slice(2))}</p>`);
      continue;
    } else if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level} class="md-h${level}">${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    // 分割线
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      out.push('<hr class="md-hr" />');
      continue;
    }

    // 无序列表
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) { out.push('<ul class="md-ul">'); inUl = true; }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    } else if (inUl) {
      out.push('</ul>'); inUl = false;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) { out.push('<ol class="md-ol">'); inOl = true; }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    } else if (inOl) {
      out.push('</ol>'); inOl = false;
    }

    // 空行
    if (line.trim() === '') {
      out.push('');
      continue;
    }

    // 普通段落
    out.push(`<p class="md-p">${renderInline(line)}</p>`);
  }

  if (inUl) out.push('</ul>');
  if (inOl) out.push('</ol>');
  if (inQuote) out.push('</blockquote>');
  if (inCode) out.push(`<pre class="md-code-block"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);

  return out.join('\n');
}
</script>

<template>
  <div class="mat-markdown" v-html="html" />
</template>

<style scoped lang="scss">
.mat-markdown {
  width: 100%;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-1);
}

.md-h1 { margin: 16px 0 8px; font-size: 24px; font-weight: 700; }
.md-h2 { margin: 14px 0 6px; font-size: 20px; font-weight: 600; }
.md-h3 { margin: 12px 0 6px; font-size: 17px; font-weight: 600; }
.md-h4, .md-h5, .md-h6 { margin: 10px 0 4px; font-size: 15px; font-weight: 600; }

.md-p { margin: 6px 0; }

.md-ul, .md-ol {
  margin: 6px 0;
  padding-left: 22px;
}

.md-quote {
  margin: 8px 0;
  padding: 8px 12px;
  color: var(--color-text-3);
  border-left: 3px solid var(--color-primary);
  background: var(--color-bg-2);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.md-hr {
  margin: 12px 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.md-inline-code {
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-primary);
  background: var(--color-bg-2);
  border-radius: var(--radius-sm);
}

.md-code-block {
  margin: 8px 0;
  padding: 12px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-1);
  background: var(--color-bg-3);
  border-radius: var(--radius-md);

  code {
    font-family: inherit;
  }
}
</style>
