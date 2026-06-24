# Bilibili 收藏夹管理助手 — 开发规范

## 核心规则

### 1. 组件开发前必须先设计

**优先级：CRITICAL**

在编写任何新组件或大幅重构现有组件之前，**必须**先使用 `ui-ux-pro-max` 技能进行页面/组件设计。

#### 流程

1. **设计阶段**：调用 `ui-ux-pro-max` 技能，产出组件的视觉设计方案（布局、配色、交互、动效）
2. **确认阶段**：将设计方案展示给用户确认
3. **实现阶段**：根据确认后的设计方案编写组件代码

#### 适用场景

- 新建页面级组件（popup、options、sidepanel 中的页面）
- 新建业务组件（如收藏夹卡片、关键词管理器、数据可视化面板等）
- 大幅调整现有组件的 UI/UX
- 用户明确要求 UI 优化或美化时

#### 不适用场景

- 纯逻辑修改（不涉及 UI 变化）
- 修复 bug（仅修复样式 bug 除外）
- 简单文案修改

### 2. 技术栈

- **框架**：React 19 + TypeScript
- **构建**：Vite
- **样式**：Tailwind CSS
- **UI 组件**：Radix UI + Lucide React
- **状态管理**：Zustand + Chrome Storage 中间件
- **可视化**：ECharts
- **扩展规范**：Chrome Extension Manifest V3

### 3. 代码风格

- 函数式组件 + Hooks
- 严格 TypeScript 类型检查，避免 `any`
- 组件文件使用 PascalCase 命名
- 工具函数使用 camelCase 命名
- 遵循 Prettier 格式化配置

### 4. 组件规范

- 每个组件独立目录，包含 `index.tsx`
- 共享组件放在 `src/components/` 下
- 页面组件放在对应入口目录下（`popup/components/`、`options/components/`）
- 自定义 Hook 放在 `src/hooks/` 下，独立目录

### 5. 设计规范

- 遵循 B 站品牌色系（主色 `#00AEEC`、粉色 `#FB7299`）
- 使用 B 站风格的圆角、阴影和动效
- 保证无障碍性（对比度、键盘导航）
- 响应式设计，适配 Chrome 扩展的各种面板尺寸
