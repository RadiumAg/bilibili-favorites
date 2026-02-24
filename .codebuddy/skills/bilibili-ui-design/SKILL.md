---
name: bilibili-ui-design
description: B站风格 UI 设计规范。适用于 React + Tailwind CSS 项目的 UI 开发，包含 B 站品牌色、组件样式规范、交互设计指南。当用户请求设计、美化、优化 UI 界面时使用此技能。
---

# B站风格 UI 设计规范

## 品牌色彩系统

### 主色调

| 名称      | 色值         | Tailwind 类                     | 用途                   |
| --------- | ------------ | ------------------------------- | ---------------------- |
| **B站粉** | `#FB7299`    | `bg-[#FB7299]`                  | 强调、警告、热门标签   |
| **B站蓝** | `#00AEEC`    | `bg-[#00AEEC]` / `bg-b-primary` | 主按钮、链接、选中状态 |
| **深蓝**  | `#0095CC`    | `bg-[#0095CC]`                  | 悬停状态               |
| **浅蓝**  | `#00AEEC/10` | `bg-[#00AEEC]/10`               | 背景高亮、选中背景     |

### 中性色

| 名称         | 色值      | 用途           |
| ------------ | --------- | -------------- |
| **主文本**   | `#18191C` | 标题、正文     |
| **次要文本** | `#61666D` | 描述、辅助信息 |
| **占位符**   | `#9499A0` | 输入框占位符   |
| **边框**     | `#E3E5E7` | 分割线、边框   |
| **背景**     | `#F1F2F3` | 页面背景       |
| **卡片背景** | `#FFFFFF` | 卡片、弹窗     |

---

## 组件样式规范

### 按钮

```tsx
// 主按钮
<Button className="bg-[#00AEEC] hover:bg-[#0095CC] text-white">
  主要操作
</Button>

// 次要按钮
<Button variant="outline" className="border-[#00AEEC] text-[#00AEEC] hover:bg-[#00AEEC]/10">
  次要操作
</Button>

// 危险按钮
<Button className="bg-[#FB7299] hover:bg-[#FB7299]/80 text-white">
  危险操作
</Button>

// 小按钮（Popup 用）
<Button size="sm" className="bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6">
  小按钮
</Button>
```

### 卡片

```tsx
// 标准卡片
<div className="bg-white rounded-xl border border-[#00AEEC]/20 shadow-sm overflow-hidden">
  {/* 渐变标题栏 */}
  <div className="bg-gradient-to-r from-[#00AEEC] to-[#00AEEC]/80 px-4 py-3 text-white font-medium">
    标题
  </div>
  {/* 内容区 */}
  <div className="p-4">
    内容
  </div>
</div>

// 可选中卡片
<div className={classNames(
  'p-3 rounded-lg cursor-pointer transition-all duration-200 border-2',
  {
    'bg-[#00AEEC] text-white border-[#00AEEC] shadow-md shadow-[#00AEEC]/30': selected,
    'border-transparent hover:bg-[#00AEEC]/5 hover:border-[#00AEEC]/20': !selected,
  }
)}>
  卡片内容
</div>
```

### 列表项

```tsx
// 视频列表项
<div
  className={classNames(
    'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border-2 group',
    {
      'border-[#00AEEC] bg-[#00AEEC]/5 shadow-sm shadow-[#00AEEC]/20': selected,
      'border-transparent hover:bg-gray-50 hover:border-gray-200': !selected,
    },
  )}
>
  {/* 封面 */}
  <img src={cover} className="w-24 h-14 object-cover rounded-lg shadow-sm" />

  {/* 标题 */}
  <div
    className={classNames('text-sm line-clamp-2 font-medium', {
      'text-[#00AEEC]': selected,
      'text-gray-700': !selected,
    })}
  >
    {title}
  </div>

  {/* 选中指示器 */}
  <div
    className={classNames(
      'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all',
      {
        'bg-[#00AEEC] text-white shadow-md shadow-[#00AEEC]/30': selected,
        'border-2 border-gray-200 group-hover:border-[#00AEEC]/50': !selected,
      },
    )}
  >
    {selected && '✓'}
  </div>
</div>
```

### 标签/徽章

```tsx
// 数量标签
<span className={classNames('text-xs px-1.5 py-0.5 rounded-full', {
  'bg-white/20': active,
  'bg-[#00AEEC]/10 text-[#00AEEC]': !active,
})}>
  {count}
</span>

// 状态标签
<span className="bg-[#FB7299] text-white text-xs px-2 py-0.5 rounded">
  热门
</span>
```

---

## 交互设计规范

### 过渡动画

```css
/* 标准过渡 */
transition-all duration-200

/* 颜色过渡 */
transition-colors duration-200

/* 缓动函数 */
ease-in-out
```

### 悬停效果

| 元素类型 | 悬停效果                                                             |
| -------- | -------------------------------------------------------------------- |
| 按钮     | 颜色加深 `hover:bg-[#0095CC]`                                        |
| 卡片     | 边框显示 + 浅色背景 `hover:border-[#00AEEC]/20 hover:bg-[#00AEEC]/5` |
| 列表项   | 背景变化 `hover:bg-gray-50`                                          |
| 链接     | 下划线 + 颜色变化                                                    |

### 选中状态

| 元素类型 | 选中样式                   |
| -------- | -------------------------- |
| 列表项   | 主色边框 + 浅色背景 + 阴影 |
| 复选框   | 主色填充 + 白色勾选        |
| Tab      | 主色背景 + 白色文字        |

### 拖拽状态

```tsx
// 拖拽目标悬停
<div
  className={classNames({
    'border-[#00AEEC] border-dashed bg-[#00AEEC]/10': isDragOver,
  })}
>
  拖拽目标
</div>
```

---

## 滚动条样式

项目已配置以下 Tailwind 工具类：

| 类名               | 效果                        |
| ------------------ | --------------------------- |
| `scrollbar-hide`   | 完全隐藏滚动条              |
| `scrollbar-styled` | 美化滚动条（8px，主色滑块） |
| `scrollbar-thin`   | 细滚动条（4px，主色滑块）   |

```tsx
<ScrollArea className="scrollbar-thin">内容</ScrollArea>
```

---

## 布局规范

### 间距系统

| 用途       | 间距                        |
| ---------- | --------------------------- |
| 组件内边距 | `p-2` / `p-3` / `p-4`       |
| 列表项间距 | `space-y-1.5` / `space-y-2` |
| 卡片间距   | `gap-4`                     |
| 页面边距   | `px-4 py-3`                 |

### 圆角

| 元素 | 圆角                     |
| ---- | ------------------------ |
| 按钮 | `rounded` / `rounded-lg` |
| 卡片 | `rounded-xl`             |
| 图片 | `rounded-lg`             |
| 标签 | `rounded-full`           |

### 阴影

```css
/* 卡片阴影 */
shadow-sm

/* 选中状态阴影 */
shadow-md shadow-[#00AEEC]/30

/* 悬浮元素阴影 */
shadow-lg
```

---

## 加载状态

### 骨架屏

```tsx
<div className="flex gap-3">
  <Skeleton className="w-24 h-14 rounded-lg" />
  <div className="flex-1 space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-3 w-1/3" />
  </div>
</div>
```

### 加载动画

```tsx
<div className="animate-spin w-10 h-10 border-4 border-[#00AEEC] border-t-transparent rounded-full" />
```

### 遮罩层

```tsx
<div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
  <div className="text-center">
    <div className="animate-spin w-10 h-10 border-4 border-[#00AEEC] border-t-transparent rounded-full mx-auto mb-3" />
    <div className="text-sm text-[#00AEEC] font-medium">加载中...</div>
  </div>
</div>
```

---

## 空状态

```tsx
<div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
  <span className="text-4xl">📭</span>
  <span>暂无数据</span>
</div>
```

---

## 提示信息

```tsx
// 底部提示条
<div className="px-4 py-2.5 border-t border-[#00AEEC]/10 bg-[#00AEEC]/5 text-xs text-[#00AEEC] flex items-center gap-2">
  <span className="text-sm">💡</span>
  <span>提示信息内容</span>
</div>
```

---

## 检查清单

### 视觉一致性

- [ ] 使用 B 站主色 `#00AEEC` 作为主色调
- [ ] 选中状态使用主色边框 + 浅色背景 + 阴影
- [ ] 悬停状态有明显的视觉反馈
- [ ] 所有可点击元素添加 `cursor-pointer`

### 交互体验

- [ ] 过渡动画时长 150-300ms
- [ ] 拖拽目标有明显的视觉提示
- [ ] 加载状态使用骨架屏或 loading 动画
- [ ] 空状态有友好的提示

### 布局规范

- [ ] 使用 `rounded-xl` 作为卡片圆角
- [ ] 使用渐变标题栏 `bg-gradient-to-r from-[#00AEEC] to-[#00AEEC]/80`
- [ ] 滚动区域使用 `scrollbar-thin` 或 `scrollbar-styled`
