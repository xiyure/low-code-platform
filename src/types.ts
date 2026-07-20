/** 画布组件节点 */
export interface ComponentNode {
  /** 实例 id */
  id: string;
  /** 物料 id，对应 registry */
  componentId: string;
  name: string;
  /** 组件属性（值支持 {{变量名}} 模板引用页面变量） */
  props: Record<string, unknown>;
  /** 样式 */
  style: Record<string, string>;
  /** 尺寸（width 控制流式布局中的宽度，height 仅用于编辑态占位） */
  size: { width: number; height: number };
  /** 容器型组件的子节点（默认 slot） */
  children: ComponentNode[];
  /** 命名 slot 子节点（如折叠面板的每个面板），key 为 slot 名称 */
  slots?: Record<string, ComponentNode[]>;
  /** 事件绑定 */
  events?: ComponentEvent[];
}

/** 页面变量 */
export interface Variable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: string | number | boolean;
  description?: string;
}

/** 事件动作类型 */
export type EventActionType =
  | 'none'
  | 'openUrl'
  | 'showMessage'
  | 'setVariable'
  | 'showComponent'
  | 'hideComponent'
  | 'toggleComponent'
  | 'switchPage'
  | 'openModal'
  | 'closeModal'
  | 'callWorkflow';

/** 事件动作配置（按 action 取用对应字段） */
export interface EventActionConfig {
  /** openUrl：跳转地址 */
  url?: string;
  /** showMessage：消息类型 */
  messageType?: 'success' | 'warning' | 'info' | 'error';
  /** showMessage：消息内容，支持 {{变量名}} */
  messageText?: string;
  /** setVariable：目标变量 id */
  variableId?: string;
  /** setVariable：变量新值，支持 {{变量名}} */
  variableValue?: string;
  /** show/hide/toggle：目标组件实例 id */
  targetId?: string;
  /** switchPage：目标页面 id */
  pageId?: string;
  /** openModal/closeModal：目标弹窗组件 id */
  modalId?: string;
  /** callWorkflow：工作流 id（当前保留类型，执行逻辑待后端接入） */
  workflowId?: string;
  /** callWorkflow：工作流入参（JSON 字符串，支持 {{变量名}}） */
  workflowParams?: string;
}

/** 单个响应动作（一个事件可挂多个动作，按序执行） */
export interface EventAction {
  /** 动作实例 id */
  id: string;
  action: EventActionType;
  config?: EventActionConfig;
}

/** 组件事件绑定：一个触发事件 → 多个响应动作 */
export interface ComponentEvent {
  type:
    | 'load'
    | 'click'
    | 'doubleClick'
    | 'mouseEnter'
    | 'mouseLeave'
    | 'submit'
    | 'focus'
    | 'blur'
    | 'change';
  actions: EventAction[];
}

/** 属性面板字段定义（配置驱动渲染） */
export interface PropertyField {
  key: string;
  label: string;
  type:
    | 'input'
    | 'textarea'
    | 'select'
    | 'switch'
    | 'number'
    | 'color'
    | 'slider'
    | 'iconPicker'
    | 'optionsEditor'
    | 'itemsEditor';
  options?: { label: string; value: string | number | boolean }[];
  default?: unknown;
  group?: 'props' | 'style' | 'event';
  /** slider 类型的最小/最大/步长 */
  min?: number;
  max?: number;
  step?: number;
  /** itemsEditor：每行的字段定义（如 [{key:'title',label:'标题'},{key:'desc',label:'描述'}]） */
  itemFields?: { key: string; label: string; type?: 'input' | 'number' | 'color' | 'iconPicker' }[];
  /** itemsEditor：数据格式（array=对象数组 JSON，text=换行分隔文本） */
  itemFormat?: 'array' | 'text';
}

/** 物料分组（参照扣子：布局/输入/展示/自定义） */
export type MaterialGroup = 'layout' | 'input' | 'display' | 'custom';

/** 物料元信息 */
export interface MaterialMeta {
  id: string;
  name: string;
  group: MaterialGroup;
  /** Element Plus 图标组件名 */
  icon: string;
  defaultProps: Record<string, unknown>;
  defaultSize: { width: number; height: number };
  /** 支持的事件类型 */
  supportEvents: ComponentEvent['type'][];
  /** 属性面板配置 */
  propertySchema: PropertyField[];
  /** 是否容器型（可拖入子组件） */
  isContainer?: boolean;
}

/** 应用页面：每页独立维护组件树与变量 */
export interface AppPage {
  id: string;
  /** 页面名称（显示在 Tab 上） */
  name: string;
  components: ComponentNode[];
  /** 该页面的变量定义 */
  variables: Variable[];
}

/** 数据表列定义 */
export interface DataTableColumn {
  /** 列 id */
  id: string;
  /** 列名（字段名） */
  name: string;
  /** 列类型 */
  type: 'string' | 'number' | 'boolean';
}

/** 数据表配置（交互逻辑 - 配置数据表） */
export interface DataTableConfig {
  /** 表 id */
  id: string;
  /** 表名 */
  name: string;
  /** 列定义 */
  columns: DataTableColumn[];
  /** 数据行（每行为 { 列id: 值 }） */
  rows: Record<string, string | number | boolean>[];
}

/** 工作流配置（交互逻辑 - 调用工作流，当前仅展示标题） */
export interface WorkflowConfig {
  /** 工作流 id */
  id: string;
  /** 工作流名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 输入参数（JSON 字符串，后续开发时使用） */
  inputParams?: string;
}

/** 应用列表项（多页面结构） */
export interface AppListItem {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  updatedAt: number;
  /** 应用页面列表（至少 1 个） */
  pages: AppPage[];
  /** 首页 id（预览默认打开） */
  homePageId: string;
  /** 全局变量（交互逻辑，供所有页面的组件使用） */
  globalVariables?: Variable[];
  /** 数据表列表（交互逻辑，本地缓存） */
  dataTables?: DataTableConfig[];
  /** 工作流列表（交互逻辑，仅展示标题） */
  workflows?: WorkflowConfig[];
}
