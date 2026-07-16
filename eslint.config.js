// ESLint 9 Flat Config
// 文档：https://eslint.org/docs/latest/use/configure/configuration-files
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // ===== 忽略目录 =====
  {
    ignores: ['dist/**', 'dist-ssr/**', 'node_modules/**', '*.config.*', '.vscode/**'],
  },

  // ===== 基础推荐规则 =====
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  // ===== Vue 文件：使用 TS 解析器解析 <script lang="ts"> =====
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // ===== 自定义规则 =====
  {
    files: ['**/*.{ts,tsx,vue,js,mjs}'],
    rules: {
      // Vue
      'vue/multi-word-component-names': 'off', // 允许单词组件名（如 index.vue）
      'vue/no-v-html': 'off',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // 项目中允许 any（如事件 config）
      '@typescript-eslint/no-empty-object-type': 'off',

      // 基础
      'no-undef': 'off', // TS 已处理未定义变量，避免误报
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
    },
  },

  // ===== 放在最后：关闭所有与 Prettier 冲突的格式化规则 =====
  eslintConfigPrettier,
];
