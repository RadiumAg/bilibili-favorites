# CHANGELOG

```txt
Summary
  1. document grouping follow 'SemVer2.0' protocol
  2. use 'PATCH' as a minimum granularity
  3. use concise descriptions
  4. type: feat \ fix \ update \ perf \ remove \ docs \ chore
  5. version timestamp follow the yyyy.MM.dd format
```

## 1.2.6 [2025.04.28]

- feat: 分析页添加加载进度遮罩层，显示当前分析到第几个收藏夹
- feat: 图表组件空数据时展示骨架屏，数据加载中覆盖 Loading 态
- feat: 新增 useBeforeUnload Hook，数据分析进行中关闭窗口弹出确认提示
- feat: Popup 弹窗新增刷新按钮
- fix: 收藏夹列表缓存从 sessionStorage 改为 localStorage，跨会话持久化
- update: Title/CardTitle 组件新增 desc 属性样式支持

## 1.2.5 [2025.04.27]

- fix: 移除 ai-gate 中多余的流式错误检查代码

## 1.2.1 [2025.04.14]

- fix: bar-chart 柱状图圆角修复，解决底部被切掉的问题

## 1.2.0 [2025.04.14]

- feat: AI 智能移动功能，支持根据视频内容自动分类到对应收藏夹
- feat: 新增 useMove Hook 的完整测试覆盖
- update: drag-manager 文件夹选中状态样式优化，更柔和的专业设计
- update: bar-chart 柱状图颜色统一为 B站品牌色渐变
- update: AI 分类 Prompt 优化，强化 targetFavorite 必须在可用列表内的约束
- update: 使用 useFavoriteData Hook 替代直接使用全局状态

## 1.1.4 [2025.02.05]

- feat: 新增新手引导功能（Tour），首次打开时自动展示
- feat: Tour 引导采用 Ant Design 风格，高亮目标元素 + 气泡提示
- feat: 引导步骤包括：收藏夹列表、设置默认收藏夹、关键字过滤、智能操作
- update: 切换为多巴胺配色风格（紫色/粉色渐变主题）
- update: 统一使用 cn 函数替代 classNames
- fix: 优化 keyword 组件边框颜色

## 0.0.0 [2024.12.02]

- feat: initial
- feat: generator by ![create-chrome-ext](https://github.com/guocaoyi/create-chrome-ext)
