// Stylelint 配置
// 文档：https://stylelint.io/user-guide/configure
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue',
    'stylelint-config-recess-order',
  ],
  rules: {
    // 关闭对 BEM/中文类名不友好的规则
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,
    'custom-property-pattern': null,
    'at-rule-no-unknown': null,
    // 允许降序特异性（scoped 样式常见）
    'no-descending-specificity': null,
    // 关键字大小写（如 none/auto）不强制
    'value-keyword-case': null,
    // 允许 vendor 前缀（兼容性场景）
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
  },
};
