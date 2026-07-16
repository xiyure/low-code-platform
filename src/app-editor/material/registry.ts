import type { MaterialMeta, MaterialGroup } from '@/types';

/** 物料分组定义 */
export const materialGroups: { key: MaterialGroup; name: string }[] = [
  { key: 'container', name: '容器' },
  { key: 'form', name: '表单' },
  { key: 'display', name: '展示' },
];

/** 物料注册表：id → 元信息 */
export const materialRegistry: Record<string, MaterialMeta> = {
  container: {
    id: 'container',
    name: '容器',
    group: 'container',
    icon: 'Grid',
    defaultProps: { padding: 16, gap: 12, background: '#ffffff' },
    defaultSize: { width: 480, height: 240 },
    supportEvents: [],
    propertySchema: [
      { key: 'padding', label: '内边距', type: 'number', default: 16, group: 'props' },
      { key: 'gap', label: '间距', type: 'number', default: 12, group: 'props' },
      { key: 'background', label: '背景色', type: 'color', default: '#ffffff', group: 'style' },
    ],
  },
  button: {
    id: 'button',
    name: '按钮',
    group: 'form',
    icon: 'Pointer',
    defaultProps: { text: '按钮', type: 'primary' },
    defaultSize: { width: 120, height: 40 },
    supportEvents: ['click'],
    propertySchema: [
      { key: 'text', label: '按钮文字', type: 'input', default: '按钮', group: 'props' },
      {
        key: 'type',
        label: '按钮类型',
        type: 'select',
        default: 'primary',
        options: [
          { label: '主要', value: 'primary' },
          { label: '默认', value: 'default' },
          { label: '成功', value: 'success' },
          { label: '危险', value: 'danger' },
        ],
        group: 'props',
      },
    ],
  },
  input: {
    id: 'input',
    name: '输入框',
    group: 'form',
    icon: 'Edit',
    defaultProps: { label: '输入框', placeholder: '请输入', required: false },
    defaultSize: { width: 320, height: 64 },
    supportEvents: ['change', 'focus', 'blur'],
    propertySchema: [
      { key: 'label', label: '标签', type: 'input', default: '输入框', group: 'props' },
      { key: 'placeholder', label: '占位提示', type: 'input', default: '请输入', group: 'props' },
      { key: 'required', label: '是否必填', type: 'switch', default: false, group: 'props' },
    ],
  },
  text: {
    id: 'text',
    name: '文本',
    group: 'display',
    icon: 'Document',
    defaultProps: { content: '这是一段文本', level: 3, align: 'left' },
    defaultSize: { width: 320, height: 48 },
    supportEvents: ['click'],
    propertySchema: [
      { key: 'content', label: '内容', type: 'textarea', default: '这是一段文本', group: 'props' },
      {
        key: 'level',
        label: '层级',
        type: 'select',
        default: 3,
        options: [
          { label: '标题1', value: 1 },
          { label: '标题2', value: 2 },
          { label: '标题3', value: 3 },
          { label: '正文', value: 4 },
        ],
        group: 'props',
      },
      {
        key: 'align',
        label: '对齐',
        type: 'select',
        default: 'left',
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
        group: 'props',
      },
    ],
  },
  image: {
    id: 'image',
    name: '图片',
    group: 'display',
    icon: 'Picture',
    defaultProps: { src: '', alt: '图片', radius: 8 },
    defaultSize: { width: 240, height: 160 },
    supportEvents: ['click'],
    propertySchema: [
      { key: 'src', label: '图片地址', type: 'input', default: '', group: 'props' },
      { key: 'alt', label: '替代文本', type: 'input', default: '图片', group: 'props' },
      { key: 'radius', label: '圆角', type: 'number', default: 8, group: 'style' },
    ],
  },
  table: {
    id: 'table',
    name: '表格',
    group: 'display',
    icon: 'Menu',
    defaultProps: { columns: 3, rows: 3 },
    defaultSize: { width: 480, height: 200 },
    supportEvents: [],
    propertySchema: [
      { key: 'columns', label: '列数', type: 'number', default: 3, group: 'props' },
      { key: 'rows', label: '行数', type: 'number', default: 3, group: 'props' },
    ],
  },
};

/** 按分组获取物料列表 */
export function listMaterialsByGroup(): Record<MaterialGroup, MaterialMeta[]> {
  const result: Record<MaterialGroup, MaterialMeta[]> = {
    container: [],
    form: [],
    display: [],
  };
  for (const meta of Object.values(materialRegistry)) {
    result[meta.group].push(meta);
  }
  return result;
}
