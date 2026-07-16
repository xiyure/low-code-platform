# 开发文档

> 仿字节扣子「创建应用」的低代码 AI 应用搭建平台。画布拖拽搭建页面 + 变量系统 + 事件编排 + 预览发布。

## 目录

- [技术栈](#技术栈)
- [架构设计](#架构设计)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [模块详解](#模块详解)
- [新增模块指南](#新增模块指南)
- [API 层与 Mock 机制](#api-层与-mock-机制)
- [接入服务端指南](#接入服务端指南)
- [代码规范](#代码规范)
- [常用命令](#常用命令)

---

## 技术栈

| 分类 | 选型 | 版本 |
|------|------|------|
| 框架 | Vue 3 + `<script setup lang="ts">` | ^3.5 |
| 构建工具 | Vite | ^5.4 |
| 状态管理 | Pinia | ^3.0 |
| 路由 | Vue Router | ^4.4 |
| UI 库 | Element Plus + @element-plus/icons-vue | ^2.14 |
| 拖拽排序 | vuedraggable | 4.1 |
| 工具库 | lodash-es（深拷贝）、nanoid（ID 生成） | - |
| 类型检查 | vue-tsc + TypeScript | ^5.6 |
| 代码规范 | ESLint 9 (flat config) + Prettier + Stylelint | - |

---

## 架构设计

项目采用 **模块化 + 轻量 DDD 分层** 架构。按业务领域划分模块，每个模块内部包含四层，保持业务内聚与边界清晰。

### 分层模型

```
┌─────────────────────────────────────────────────┐
│              src/ (应用壳)                       │
│  main.ts / App.vue / router/index.ts / styles.css │
└───────────────┬─────────────────────────────────┘
                │ 组装
┌───────────────▼─────────────────────────────────┐
│            modules/ (业务模块)                    │
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ space   │ │ editor  │ │material │ │preview ││
│  │ 空间域  │ │ 编辑器域│ │ 物料域  │ │ 预览域 ││
│  └─────────┘ └─────────┘ └─────────┘ └────────┘│
│              ┌──────────┐                       │
│              │ shared   │  ← 共享内核            │
│              │ 通用类型/│    (被所有模块依赖)     │
│              │ 工具/HTTP │                       │
│              └──────────┘                       │
└──────────────────────────────────────────────────┘
```

### 模块内四层结构

每个业务模块（space/editor 等）内部遵循以下分层：

| 层 | 目录 | 职责 | 依赖规则 |
|----|------|------|----------|
| **domain** | `domain/` | 领域类型定义 + 纯函数业务规则 | 不依赖任何层 |
| **application** | `application/` | 应用服务（Pinia store），用例编排 | 依赖 domain + infrastructure |
| **infrastructure** | `infrastructure/` | 基础设施：API 调用、存储、Mock | 依赖 domain |
| **presentation** | `presentation/` | 表现层：Vue 页面/组件 | 依赖 application |

**依赖原则**：
- presentation 只调用 application 层暴露的 store 方法，不直接访问 infrastructure
- 模块间通过 application 层通信，禁止跨模块直接引用 domain/infrastructure
- shared 模块作为共享内核，提供通用类型和工具

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm（或 pnpm / yarn 均可）

### 安装与启动

```sh
npm install        # 安装依赖
npm run dev        # 启动开发服务器（默认端口 5174）
```

### 首次运行

项目首启时会自动向 `localStorage` 注入种子数据（1 个默认空间 + 2 个示例应用），无需手动初始化。

---

## 目录结构

```
src/
├── app/                            # 应用壳（组装入口）
│   ├── App.vue                     # 根组件
│   ├── main.ts                     # 应用入口（挂载 Vue/Pinia/Router/ElementPlus）
│   ├── router.ts                   # 路由配置
│   └── styles.css                  # 全局样式 + CSS 变量 + 主题覆盖
│
├── modules/                        # 业务模块（按领域划分）
│   ├── shared/                     # 共享内核（被所有模块依赖）
│   │   ├── domain/
│   │   │   └── types.ts            # 通用类型：ComponentNode/Event/Variable/MaterialMeta
│   │   ├── utils/                  # 通用工具函数
│   │   │   ├── clone.ts            # 深拷贝
│   │   │   ├── format.ts           # 时间格式化
│   │   │   ├── id.ts               # ID 生成（nanoid）
│   │   │   ├── storage.ts          # localStorage 读写封装
│   │   │   └── variable.ts         # 变量模板解析 {{变量名}}
│   │   └── infrastructure/
│   │       └── request.ts          # HTTP 请求封装（fetch，接入后端时使用）
│   │
│   ├── space/                      # 空间域
│   │   ├── domain/
│   │   │   └── types.ts            # Space / AppListItem 类型
│   │   ├── application/
│   │   │   └── spaceStore.ts       # 空间/应用列表状态管理
│   │   ├── infrastructure/
│   │   │   ├── spaceApi.ts         # 接口统一出口（按环境切换 mock/真实）
│   │   │   ├── apiContract.ts      # 接口契约（SpaceApi interface）
│   │   │   └── mock/
│   │   │       ├── mockSpaceApi.ts # localStorage Mock 实现 + 数据迁移
│   │   │       └── seedData.ts     # 种子数据（应用 + 空间）
│   │   └── presentation/
│   │       ├── SpaceHome.vue       # 空间首页（应用列表 + 新建/删除）
│   │       └── WorkspaceLayout.vue # 顶部导航布局（Logo + 空间切换）
│   │
│   ├── editor/                     # 编辑器域
│   │   ├── application/
│   │   │   └── editorStore.ts      # 画布节点 + 变量 + 撤销重做
│   │   └── presentation/
│   │       ├── AppEditor.vue       # 编辑器主页面（三栏布局 + 工具栏）
│   │       ├── ComponentPanel.vue  # 左侧组件库
│   │       ├── Canvas.vue          # 中间画布（流式布局 + 拖拽排序 + 拉伸）
│   │       ├── PropertyPanel.vue   # 右侧属性面板（属性/样式/事件）
│   │       ├── EventBlock.vue      # 事件块（事件类型 → 动作列表）
│   │       ├── ActionItem.vue      # 单个动作配置
│   │       └── VariableDrawer.vue  # 变量管理抽屉
│   │
│   ├── material/                   # 物料域
│   │   ├── registry.ts             # 物料注册表（6 种物料的元信息）
│   │   ├── ComponentRenderer.vue   # 根据 node.componentId 渲染对应物料
│   │   └── widgets/                # 物料组件
│   │       ├── Container.vue
│   │       ├── ButtonWidget.vue
│   │       ├── InputWidget.vue
│   │       ├── TextBlock.vue
│   │       ├── ImageBlock.vue
│   │       └── DataTable.vue
│   │
│   └── preview/                    # 预览域
│       └── presentation/
│           └── AppPreview.vue      # 应用预览页
```

---

## 模块详解

### shared（共享内核）

被所有业务模块依赖的基础设施，不含业务逻辑。

- **domain/types.ts**：跨域共享的类型定义（ComponentNode、Event、Variable、MaterialMeta、PropertyField）
- **utils/**：通用工具函数（深拷贝、ID 生成、localStorage 封装、变量模板解析、时间格式化）
- **infrastructure/request.ts**：基于 fetch 的 HTTP 请求封装，为接入后端预留

### space（空间域）

管理空间与应用的生命周期。

| 层 | 文件 | 说明 |
|----|------|------|
| domain | `types.ts` | Space、AppListItem 类型 |
| application | `spaceStore.ts` | 空间初始化、应用列表加载/创建/删除、空间切换 |
| infrastructure | `spaceApi.ts` | 接口出口，按 `VITE_USE_MOCK` 切换 mock/真实 |
| infrastructure | `apiContract.ts` | SpaceApi 接口契约 |
| infrastructure/mock | `mockSpaceApi.ts` | localStorage 实现 + 旧数据迁移 |
| infrastructure/mock | `seedData.ts` | 种子数据（2 个示例应用 + 1 个空间） |
| presentation | `SpaceHome.vue` | 空间首页，应用卡片列表 |
| presentation | `WorkspaceLayout.vue` | 顶部导航布局 |

### editor（编辑器域）

画布编辑器的核心逻辑与 UI。

| 层 | 文件 | 说明 |
|----|------|------|
| application | `editorStore.ts` | 画布节点管理、变量管理、撤销重做（past/future 快照） |
| presentation | `AppEditor.vue` | 三栏布局主页面，工具栏（返回/撤销/重做/预览/保存） |
| presentation | `Canvas.vue` | 流式画布，拖拽排序、选中工具栏、右下角拉伸手柄 |
| presentation | `PropertyPanel.vue` | 属性/样式/事件三 Tab 配置面板 |
| presentation | `EventBlock.vue` | 事件块：事件类型 → 动作列表 |
| presentation | `ActionItem.vue` | 单个动作配置（6 种动作） |
| presentation | `ComponentPanel.vue` | 左侧组件库，按分组展示 |
| presentation | `VariableDrawer.vue` | 变量管理抽屉 |

### material（物料域）

物料注册与渲染。

| 文件 | 说明 |
|------|------|
| `registry.ts` | 物料注册表，定义 6 种物料的元信息（name/group/icon/defaultProps/propertySchema） |
| `ComponentRenderer.vue` | 根据 `node.componentId` 动态渲染对应物料组件 |
| `widgets/*.vue` | 物料组件实现（Container/Button/Input/Text/Image/Table） |

**新增物料步骤**：
1. 在 `widgets/` 下新建组件 `.vue`
2. 在 `registry.ts` 的 `materialRegistry` 注册元信息
3. 在 `ComponentRenderer.vue` 的 `componentMap` 添加映射

### preview（预览域）

应用预览与事件执行。

| 文件 | 说明 |
|------|------|
| `presentation/AppPreview.vue` | 读取应用数据 → 解析变量模板 → 绑定事件 → 执行动作链 |

---

## 新增模块指南

后续集成新业务模块时，按以下步骤创建：

### 1. 创建模块目录

```
src/modules/<module-name>/
├── domain/
│   └── types.ts          # 模块领域类型
├── application/
│   └── <module>Store.ts  # Pinia store
├── infrastructure/        # 如需调用接口
│   └── <module>Api.ts
└── presentation/
    └── *.vue              # 页面/组件
```

### 2. 注册路由

在 `src/router/index.ts` 添加路由，import 指向 `@/modules/<module-name>/presentation/`。

### 3. 依赖规则

- 需要通用类型/工具时，import `@/modules/shared/`
- 需要调用其他模块时，import 其 `application` 层的 store
- 禁止直接 import 其他模块的 `infrastructure` 或 `presentation`

---

## API 层与 Mock 机制

### 分层设计

```
modules/space/infrastructure/
├── spaceApi.ts        # 接口统一出口，按环境变量切换实现
├── apiContract.ts     # 接口契约（SpaceApi interface）
└── mock/
    ├── mockSpaceApi.ts # localStorage Mock 实现 + 旧数据迁移
    └── seedData.ts     # 种子数据

modules/shared/infrastructure/
└── request.ts          # HTTP 请求封装（接入后端时使用）
```

### 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_API_BASE_URL` | 接口基础地址 | `/api` |
| `VITE_USE_MOCK` | 是否使用本地 Mock（`true`/`false`） | 开发 `true`，生产 `false` |

### 数据持久化

- **存储位置**：`localStorage`，key 前缀 `zq_platform:`
- **存储 key**：`zq_platform:apps`（应用列表）、`zq_platform:spaces`（空间）、`zq_platform:current_space`（当前空间）
- **封装**：`modules/shared/utils/storage.ts` 提供 `readJson` / `writeJson` / `removeKey`

### 数据迁移

`mock/mockSpaceApi.ts` 模块加载时自动检测并迁移旧版数据：

- 旧版自由画布 `position` 字段 → 剔除
- 旧版一对一事件结构 → 升级为一对多 `actions` 数组
- 缺失 `variables` 字段 → 补空数组

迁移对用户无感，刷新即生效。

---

## 接入服务端指南

当前项目使用 localStorage Mock，接入真实后端只需 **3 步**：

### 第 1 步：配置环境变量

在 `.env.development`（或新建 `.env.local`）中设置：

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api.example.com
```

### 第 2 步：实现真实接口

编辑 `src/modules/space/infrastructure/spaceApi.ts`，将 `realSpaceApi` 的占位实现替换为基于 `http` 封装的真实调用：

```ts
import { http } from '@/modules/shared/infrastructure/request';

const realSpaceApi: SpaceApi = {
  listApps: (spaceId) => http.get(`/spaces/${spaceId}/apps`),
  getApp: (appId) => http.get(`/apps/${appId}`),
  saveApp: (app) => http.put(`/apps/${app.id}`, app),
  deleteApp: (appId) => http.delete(`/apps/${appId}`),
  createApp: (spaceId, name) => http.post(`/spaces/${spaceId}/apps`, { name }),
};
```

### 第 3 步：确认后端响应格式

`request.ts` 默认解析 `{ code, message, data }` 包裹结构并提取 `data`。
若后端响应格式不同，调整 `request.ts` 的 `unwrap` 逻辑即可。

> Store 层和页面层**无需任何改动**，因为它们只依赖 `SpaceApi` 接口契约。

---

## 代码规范

项目配置了三套格式化工具，保存时自动执行。

### 工具配置文件

| 工具 | 配置文件 | 作用 |
|------|----------|------|
| ESLint 9 | `eslint.config.js` | 代码质量检查（flat config） |
| Prettier | `.prettierrc.json` | 代码格式化（缩进/引号/分号） |
| Stylelint | `stylelint.config.js` | CSS 语法 + 属性排序（recess-order） |

### 保存自动格式化

需在项目中创建 `.vscode/settings.json`（受 IDE 保护需手动创建）：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript", "vue"],
  "stylelint.validate": ["css", "scss", "vue"],
  "eslint.useFlatConfig": true
}
```

### 规范要点

- 组件使用 `<script setup lang="ts">` + PascalCase 文件名
- 单个组件文件不超过 300 行，超出则拆分
- `@/` 别名指向 `src/`
- 禁止动态 import 核心组件
- 模块间只通过 application 层通信

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run type-check` | TypeScript 类型检查（vue-tsc） |
| `npm run lint` | ESLint 检查并自动修复 |
| `npm run lint:check` | ESLint 仅检查不修复 |
| `npm run lint:style` | Stylelint 检查并修复 CSS |
| `npm run format` | Prettier 格式化所有源码 |

---

## 路由说明

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | - | 重定向到默认空间 |
| `/space/:spaceId` | SpaceHome | 空间首页，应用列表 |
| `/space/:spaceId/app/:appId/edit` | AppEditor | 应用编辑器 |
| `/space/:spaceId/app/:appId/preview` | AppPreview | 应用预览 |

---

## 设计令牌

全局 CSS 变量定义于 `src/app/styles.css`：

| 变量 | 用途 | 值 |
|------|------|----|
| `--color-primary` | 品牌主色 | `#2B6BFF` |
| `--color-primary-light` | 主色浅色 | `#E8F0FF` |
| `--color-danger` | 危险色 | `#F53F3F` |
| `--color-bg-1/2/3` | 背景层级 | 白/浅灰/更浅 |
| `--color-border` | 边框色 | `#E5E6EB` |
| `--radius-sm/md` | 圆角 | `4px` / `8px` |
| `--shadow-sm` | 阴影 | 轻微投影 |

新增组件请优先使用这些变量以保持视觉一致。
