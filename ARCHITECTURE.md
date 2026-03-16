## 项目概览

本项目是一个可视化页面编辑器教学示例，基于 **Vite + Vue 3 + TypeScript + Pinia + Vue Router + Element Plus + ECharts** 实现。  
目标是让读者能清晰理解「画布编辑 → 状态管理 → 预览运行时」的完整链路。

- **运行时形态**：所有组件和画布都是「数据驱动」——编辑区只修改 `Component[]` 和 `CanvasStyle`，预览区根据同一份 schema 渲染。
- **核心数据结构**：`Component`（组件 schema）、`CanvasStyle`（画布样式）定义于 `src/types`，贯穿全工程。

目录结构（只列教学相关主干）：

- `src/main.ts` / `App.vue`：应用入口
- `src/router/`：路由（编辑页、预览页）
- `src/stores/`：Pinia store（编辑状态、命令历史 undo/redo、剪贴板、右键菜单）
- `src/components/`：通用 UI 组件（Toolbar、Editor、属性面板等）
- `src/custom-component/`：可被拖拽的业务组件及其 Attr 面板、预览运行时
- `src/utils/`：工具函数（样式、缩放、动画、事件总线、请求封装等）
- `src/composables/`：组合式函数（键盘快捷键）
- `src/constants/`：常量（动画预设、DOM id 约定、本地存储 key 等）
- `src/types/`：类型与基础 schema
- `src/styles/`：全局样式与动画样式

---

## 软件架构总览

从架构视角，本项目可以分为 5 个层次：

1. **UI 层**（视图组件）
2. **状态层**（Pinia stores）
3. **schema 与类型层**（`Component` / `CanvasStyle` 等）
4. **运行时与行为层**（预览运行时、交互、请求与动画）
5. **工具与基础设施层**（工具函数、常量、样式）

下面按层介绍。

---

## 1. UI 层（视图组件）

### 1.1 路由视图

- `src/views/Home.vue`
  - 页面布局：顶部 `Toolbar`、左侧组件列表 + 实时组件列表、中间 `Editor`、右侧属性面板。
  - 初始行为：
    - `onMounted` 时调用 `restore()`，**仅在画布为空时** 从 `localStorage` 恢复上次保存的 schema。
  - 拖拽逻辑：
    - 左侧 `ComponentList` 中的组件通过 HTML5 drag & drop 拖入中间画布。
    - `handleDrop` 中根据鼠标位置计算 `top/left`，生成新的 `Component`，写入 `editorStore.componentData`。

- `src/views/PreviewPage.vue`
  - 进入时：`editorStore.setEditMode('preview')` 并清空当前选中组件。
  - 渲染 `EditorPreview`（`src/components/editor/Preview.vue`）。
  - 关闭时：切回 `edit` 模式并返回 `Home`。

### 1.2 顶部工具栏

- `src/components/Toolbar.vue`
  - 提供以下操作：
    - 导入 / 导出 JSON（标准格式：`{ componentData: [], canvasStyleData?: {} }`）
    - 撤销 / 重做
    - 预览
    - 保存（到 `localStorage`，key 使用 `LOCAL_STORAGE_KEYS`）
    - 清空画布
    - 画布尺寸输入
  - 与 store 交互：
    - 调用 `historyStore.undo/redo` 实现撤销重做（命令模式）。
    - 调用 `editorStore.setComponentData` / `setCanvasStyle` 更新画布。

### 1.3 左侧组件列表 & 图层列表

- `src/components/ComponentList.vue`
  - 展示 `custom-component/component-list.ts` 中定义的可用组件模板。
  - 每个条目支持拖拽，拖拽时写入组件索引到 `dataTransfer`。

- `src/components/RealTimeComponentList.vue`
  - 展示当前画布上的组件（从 `editorStore.componentData` 派生）。
  - 支持：
    - 选中组件（激活右侧 Attr 面板）
    - 上移 / 下移 / 置顶 / 置底（改变数组顺序）
    - 删除组件

### 1.4 中间画布与编辑器

- `src/components/editor/Editor.vue`
  - 绑定 `editorStore.componentData`、`canvasStyleData`。
  - 根节点样式：
    - 基础样式来自 `getCanvasStyle(canvasStyleData)`。
    - 宽高单独拼接 `px`，便于理解。
  - 每个组件由 `Shape.vue` 包裹：
    - 外层 `Shape` 负责位置、缩放、选中、拖动、拉伸。
    - 内层 `<component :is="item.component">` 只关心自身样式（通过 `getComponentStyle` 去掉 `width/height/top/left` 这类布局字段）。
  - 右键菜单：
    - 捕获 `contextmenu` 事件，计算相对画布的坐标，调用 `contextmenuStore.showContextMenu`。

- `src/components/editor/Shape.vue`
  - 提供：
    - 八个缩放点（lt/t/rt/r/rb/b/lb/l）。
    - 拖拽移动。
    - 更新当前选中组件。
  - 使用 `utils/calculatePosition.ts` 计算各个缩放点对应的样式变更。
  - **高频交互**：拖拽移动/缩放过程中不入栈，只在 `mouseup` 时用 `historyStore.beginUpdate/commitUpdate` 记录一次 `update` 命令。

### 1.5 右键菜单与辅助组件

- `src/components/editor/ContextMenu.vue`
  - 使用 `contextmenuStore` 控制显示位置。
  - 操作：
    - 复制 / 剪切 / 粘贴（委托 `copyStore`）
    - 删除组件
    - 上移 / 下移 / 置顶 / 置底
  - 对会改变画布数据的操作，会执行 `historyStore` 的命令（add/delete/reorder）。

- `src/components/editor/MarkLine.vue`
  - 根据当前拖拽组件与其他组件的边界差值，在对齐时显示辅助线。
  - 使用 `eventBus` 监听移动事件。

- `src/components/editor/Grid.vue`
  - 简单网格背景，增强画布感知。

### 1.6 属性面板

- `src/components/CanvasAttr.vue`
  - 无组件选中时显示，用于配置画布背景色、字体大小等。

- `src/custom-component/common/CommonAttr.vue`
  - 有组件选中时显示：
    - 通用样式（基于 `utils/attr.ts` 的 `styleData`）
    - 交互配置（`InteractionAttr.vue`）
    - 事件订阅（`SubscriptionsAttr.vue`）
  - 根据组件的 `style` 键过滤要展示的表单项。

---

## 2. 状态层（Pinia Stores）

所有 store 导出统一在 `src/stores/index.ts`，并带有简短说明。

### 2.1 编辑 store：`editor.ts`

核心状态：

- `componentData: Component[]`：画布上的组件列表（schema 主体）。
- `curComponent: Component | null` / `curComponentIndex: number | null`：当前选中组件及索引。
- `canvasStyleData: CanvasStyle`：画布宽高、缩放、背景等。
- `editMode: 'edit' | 'preview'`：编辑 / 预览模式。
- 其他 UI 状态：`isClickComponent`、`isInEditor`、`rightList`、`editor`（DOM 引用）。

主要方法：

- `setCurComponent(component, index)`：更新当前选中。
- `addComponent(component, index?)`：插入组件。
- `deleteComponent(index?)`：删除组件并处理选中状态。
- `setComponentData(list)`：一次性替换组件列表（导入 / 撤销等场景）。
- `setCanvasStyle(style)`：设置画布样式。
- 上移 / 下移 / 置顶 / 置底：通过数组 `splice` 调整顺序。

### 2.2 命令历史 store：`history.ts`

撤销/重做采用 **命令模式（Command Pattern）**，只记录四类基础操作：

- `add`：添加组件
- `delete`：删除组件
- `update`：更新组件属性（移动/缩放/样式/交互/文本等都归为 update）
- `reorder`：图层排序（方案二：记录 `id + fromIndex + toIndex`，线性栈下回放稳定）

核心状态：

- `done: HistoryCommand[]`：已执行命令栈
- `undone: HistoryCommand[]`：撤销后的命令栈（redo）
- `MAX_HISTORY = 100`：命令阈值，超过会裁剪最早历史

常用 API：

- `executeAdd(component, index?, label?)`
- `executeDeleteById(id, label?)`
- `executeUpdate(id, beforePatch, afterPatch, label?)`
- `executeReorder(id, from, to, label?)`
- `beginUpdate(id, beforePatch, label?)` + `commitUpdate(afterPatch)`：用于高频交互只在结束时入栈一次
- `undo()` / `redo()` / `clear()`

### 2.3 右键菜单 store：`contextmenu.ts`

- `menuTop` / `menuLeft`：右键菜单位置（相对画布）。
- `menuShow`：是否显示。
- `showContextMenu({ top, left })` / `hideContextMenu()`：控制菜单显示。

### 2.4 剪贴板 store：`copy.ts`

- `clipboardComponent: Component | null`：当前复制或剪切的组件。
- `isCut: boolean`：标记是否为剪切。
- `PASTE_OFFSET_PX`：粘贴时的偏移像素，避免完全重叠。

方法：

- `copy()`：深拷贝当前选中组件到剪贴板。
- `cut()`：仅标记剪切模式（剪贴板仍保存组件快照）；删除与入栈由调用方执行 `historyStore.executeDeleteById`。
- `createPastedComponent(isMouse)`：生成“可粘贴的新组件”（不直接写入画布），由调用方执行 `historyStore.executeAdd`。
- `afterPasteCommitted()`：粘贴命令执行后调用；若是剪切粘贴，会清空剪贴板并退出剪切模式。

---

## 3. schema 与类型层

所有核心类型在 `src/types` 中定义，并通过 `src/types/index.ts` 统一导出。

### 3.1 组件与画布 schema：`component.ts` / `canvas.ts`

- `ComponentStyle`
  - 包括 `top/left/width/height` 等布局属性。
  - 字体、颜色、边框、对齐等样式。

- `Component`
  - `id: string`：组件唯一标识。
  - `component: string`：注册组件名（如 `'VText'`）。
  - `label: string` / `icon: string`：列表展示信息。
  - `propValue: any`：组件专有配置（文本内容、图表 option、图片 url 等）。
  - `style: ComponentStyle`：通用样式。
  - `animations: Animation[]`：动画配置（用于订阅与自定义扩展）。
  - `events: ComponentEvent`：点击事件（alert/redirect）。
  - `triggerAnimations?: Partial<Record<PreviewEventType, Animation>>`：自身触发的动画（v-click / v-hover）。
  - `subscriptions?: SubscriptionRule[]`：订阅其他组件事件时的动作（动画为主）。
  - `groupStyle?: Partial<ComponentStyle>`：成组组件时使用的相对样式。
  - `request?: RequestConfig`：图表/表格的数据请求配置。
  - `collapseName?: string`：右侧属性面板当前展开项。

- `CanvasStyle`
  - `width/height/scale`：画布大小与缩放。
  - `color/opacity/background/fontSize`：画布级别的样式。

### 3.2 事件与动画：`event.ts` / `animation.ts`

- `PreviewEventType = 'v-click' | 'v-hover'`：预览期支持的事件类型。
- `ComponentEvent`：简单 `Record<string, string>`，在当前项目中用于 `alert` 与 `redirect`。
- `Animation`：动画配置（label/value/duration/delay/iterationCount）。
- `AnimationAction` / `SubscriptionRule`：
  - `SubscriptionRule` 描述「当某组件的某事件触发时，当前组件执行哪些动画」。

---

## 4. 运行时与行为层

### 4.1 预览运行时：`custom-component/previewRuntime.ts`

通过 `createPreviewRuntime(schema: Component[])` 把组件数组编译为可执行的事件路由表。

- 内部使用 `mitt` 创建 bus，以 `sourceId::eventType` 为 key。
- `registerSubscriptions()`：
  - 遍历所有组件的 `subscriptions`。
  - 为每条规则注册 handler：找到目标组件 DOM 元素，调用 `runAnimation` 执行动画。
- `runSelfActions(eventType, sourceId)`：
  - 处理自身 `triggerAnimations`。
  - 对 `v-click` 处理 `events.alert`（alert）和 `events.redirect`（跳转）。
- `emit(eventType, sourceId)`：
  - 先执行自身动作，再通过 bus 触发订阅动作。
- `dispose()`：
  - 解绑所有事件、清理动画与定时器。

### 4.2 键盘与事件总线

- `src/composables/useKeyboard.ts`
  - 全局监听 `keydown/keyup/mousedown`。
  - 支持：
    - Ctrl/Cmd + C/V/X：复制 / 粘贴 / 剪切。
    - Ctrl/Cmd + Z/Y：撤销 / 重做。
    - Ctrl/Cmd + S：保存。
    - Ctrl/Cmd + P：预览。
    - Delete / D：删除。
    - E：清空画布。
  - 通过 `eventBus` 派发部分事件（如 save、preview、clearCanvas）。

- `src/utils/eventBus.ts`
  - 基于 `mitt` 的简单事件总线，定义了常用事件类型（移动、预览、保存、动画控制等）。

### 4.3 请求与图表/表格

- `src/utils/request.ts`
  - 提供 `requestJSON` 等方法封装 `fetch` 请求。
  - 支持轮询（`series: true`）与最大请求次数控制。

- `src/custom-component/VChart/Component.vue`
  - 从 `element.request` 读取请求配置，调用 `requestJSON` 获取数据。
  - 使用 `applyResponse(option, data)` 约定数据结构，填充 ECharts 的 `series.data` 与 `xAxis.data`。

- `src/custom-component/VTable/Component.vue`（若存在）
  - 使用 `propValue.data` 渲染表格，可配合请求逻辑扩展。

### 4.4 动画

- `src/utils/runAnimation.ts`
  - 基于 `styles/animate.scss` 中定义的小动画集执行动画：
    - 添加 `animated` + 动画类名。
    - 支持 duration/delay/iterationCount。
    - 动画结束后移除 class。

- `src/constants/animations.ts`
  - `ANIMATION_PRESETS`：预设动画列表，与 `animate.scss` 保持一致。
  - 被 `InteractionAttr` 与 `SubscriptionsAttr` 使用，作为选择动画的选项。

---

## 5. 工具与基础设施层

### 5.1 工具函数 `src/utils`

- `common.ts`：`deepCopy`、`$`、`isPreventDrop`（用于拖拽时的特殊处理）。
- `style.ts`：
  - `getShapeStyle`：外层 shape 的定位样式。
  - `getComponentStyle`：传给内部组件的样式（排除布局字段）。
  - `getCanvasStyle`：画布容器样式。
  - `createGroupStyle`：把一组组件转换为相对样式（group/groupStyle）。
- 其他：
  - `changeComponentsSizeWithScale`：按缩放调整组件尺寸。
  - `calculatePosition`：处理 8 个缩放点的拖拽。
  - `decomposeComponent`：将 group 内组件恢复为绝对坐标。
  - `eventBus`、`toast`、`generateID` 等。

### 5.2 常量 `src/constants`

- `animations.ts`：动画预设。
- `dom.ts`：`COMPONENT_DOM_ID_PREFIX`。
- `storage.ts`：`LOCAL_STORAGE_KEYS`。

### 5.3 样式 `src/styles`

- `global.scss`：全局基础样式与 CSS 变量。
- `animate.scss`：教学用动画集合，与 `ANIMATION_PRESETS` 对应。
- `variables.scss`：全局 SASS 变量。

---

## 阅读路径建议（从 0 到 1）

如果你是第一次阅读本项目，可以按下面顺序理解架构：

1. **从页面整体到数据结构**
   - 先看 `views/Home.vue` 与 `components/Toolbar.vue`，理解界面布局和「保存/恢复」。
   - 再读 `types/component.ts`、`types/canvas.ts`，理解 `Component` 和 `CanvasStyle` 长什么样。
2. **再看状态与编辑逻辑**
   - 阅读 `stores/editor.ts`、`stores/history.ts`、`stores/copy.ts`，理解状态管理与命令式撤销/粘贴。
   - 对照 `components/editor/Editor.vue`、`Shape.vue` 看「操作如何落到 schema 上」。
3. **最后看预览运行时与高级功能**
   - 阅读 `components/editor/Preview.vue` 与 `custom-component/previewRuntime.ts`，理解预览如何重用同一份 schema。
   - 看 `custom-component/common/InteractionAttr.vue`、`SubscriptionsAttr.vue` 了解动画与订阅。

通过以上路径，可以比较完整地掌握本项目的工程架构与软件架构设计。

