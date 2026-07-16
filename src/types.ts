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
  /** 容器型组件的子节点（第一版未启用嵌套画布，保留字段以备后续扩展） */
  children: ComponentNode[];
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
  | 'switchPage';

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
  type: 'click' | 'change' | 'submit' | 'focus' | 'blur';
  actions: EventAction[];
}

/** 属性面板字段定义（配置驱动渲染） */
export interface PropertyField {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'switch' | 'number' | 'color';
  options?: { label: string; value: string | number | boolean }[];
  default?: unknown;
  group?: 'props' | 'style' | 'event';
}

/** 物料分组 */
export type MaterialGroup = 'container' | 'form' | 'display';

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
}
