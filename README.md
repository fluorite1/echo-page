本项目是一个可视化页面编辑器教学示例，基于 **Vite + Vue 3 + TypeScript + Pinia + Vue Router + Element Plus + ECharts** 实现。  
目标是让读者能清晰理解「画布编辑 → 状态管理 → 预览运行时」的完整链路。

- **运行时形态**：所有组件和画布都是「数据驱动」——编辑区只修改 `Component[]` 和 `CanvasStyle`，预览区根据同一份 schema 渲染。
- **核心数据结构**：`Component`（组件 schema）、`CanvasStyle`（画布样式）定义于 `src/types`，贯穿全工程。

工程结构：

- `src/main.ts` / `App.vue`：应用入口
- `src/router/`：路由（编辑页、预览页）
- `src/stores/`：Pinia store（编辑状态、撤销重做、剪贴板、右键菜单）
- `src/components/`：通用 UI 组件（Toolbar、Editor、属性面板等）
- `src/custom-component/`：可被拖拽的业务组件及其 Attr 面板、预览运行时
- `src/utils/`：工具函数（样式、缩放、动画、事件总线、请求封装等）
- `src/composables/`：组合式函数（键盘快捷键）
- `src/constants/`：常量（动画预设、DOM id 约定、本地存储 key 等）
- `src/types/`：类型与基础 schema
- `src/styles/`：全局样式与动画样式

---

## 软件结构

软件结构上本项目可以分为 5 个层次：

1. **UI 层**（视图组件）
2. **状态层**（Pinia stores）
3. **schema 与类型层**（`Component` / `CanvasStyle` 等）
4. **运行时与行为层**（预览运行时、交互、请求与动画）
5. **工具与基础设施层**（工具函数、常量、样式）
