## echo-page（教学项目）

本项目是一个可视化页面编辑器教学示例，基于 **Vite + Vue 3 + TypeScript + Pinia + Vue Router + Element Plus + ECharts** 实现。

- **数据驱动**：编辑区只修改 `Component[]` 与 `CanvasStyle`，预览区复用同一份 schema 渲染。
- **Undo/Redo（命令模式）**：用 `add / delete / update / reorder` 四类命令实现撤销/重做；拖拽/缩放/文本编辑等高频交互只在结束时记录一次命令。

### 快速开始

```bash
pnpm i
pnpm dev
```

构建检查：

```bash
pnpm run build
```

### 工程结构（主干）

- `src/main.ts` / `App.vue`：应用入口
- `src/router/`：路由（编辑页、预览页）
- `src/stores/`：Pinia store（编辑状态、命令历史、剪贴板、右键菜单）
- `src/components/`：通用 UI（Toolbar、Editor、属性面板等）
- `src/custom-component/`：业务组件与 Attr 面板、预览运行时
- `src/utils/`：工具函数（样式、缩放、动画、事件总线、请求封装等）
- `src/constants/`：常量（动画预设、DOM id 约定、本地存储 key 等）
- `src/types/`：类型与 schema
- `src/styles/`：全局样式与动画样式

### 文档

- 工程与软件架构说明：`ARCHITECTURE.md`
