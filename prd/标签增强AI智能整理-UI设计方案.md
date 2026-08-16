# UI 设计方案：标签增强 AI 智能整理

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 创建日期 | 2026-08-12 |
| 状态 | 已确认 · 开发中（2026-08-16） |
| 关联 PRD | `prd/标签增强AI智能整理-PRD.md`（覆盖 F2 / F3 / F4 / F3.4 默认收藏夹显性化） |
| 设计基线 | **基于现有样式增量修改**：沿用项目真实主题 token（`b-primary #BF00FF` / `b-secondary #FF1493` / 文本 `#2D1B4E`，见 `tailwind.config.js`）、现有 shadcn 组件与 Tailwind 习惯类全部沿用，不引入新字体、新色板；ai-move 弹窗内历史硬编码的 `#00AEEC`/`#FB7299` 一并统一为主题 token |

---

## 1. 设计总原则

1. **沿用现有视觉语言**：圆角（`rounded-lg`/`rounded-xl`）、卡片边框 `border-gray-200`、hover 加深为 `hover:border-[#BF00FF]/35`、渐变头图 `from-[#BF00FF]/10 to-[#FF1493]/10`、`min-h-11` 触达目标、`scrollbar-thin` 滚动容器——全部保持现状；
2. **用颜色区分"确定性"**：
   - 标签命中 = 主色紫 `#BF00FF`（b-primary，可信、确定，与现有主操作色一致）
   - AI 建议 = 品牌粉 `#FF1493`（b-secondary，智能、需留意）
   - 两个颜色即现有主题的主/副色（紫=主操作、粉=AI 图标），只是把语义固定下来；主按钮渐变复用现有 scrollbar 渐变 `#BF00FF → #FF1493`；
3. **不新增页面**：所有改动发生在 Popup 主界面、现有整理弹窗（Modal）内；
4. **动效克制**：所有过渡 150–300ms，仅用 `opacity`/`transform`/`color`，尊重 `prefers-reduced-motion`。

---

## 2. F3.1 + F3.2：Popup 底部操作区（入口整合）

### 现状

底部一行四个平级按钮：`[AI 移动] [通过标签整理(?) | 自动创建标签] [拖拽管理]`，无主次，用户不知道点哪个。

### 新布局（两行，主次分明）

```
┌──────────────────────────────────────────┐
│ ✨ 智能整理                                │  ← 主按钮：整行宽度，紫→粉渐变
│    自动把默认收藏夹的视频归类到合适的收藏夹      │     高度 44px（min-h-11）
├──────────────────────────────────────────┤
│ [🏷 规则整理 ▾]              [🖱 拖拽管理]  │  ← 次级行：outline 样式
└──────────────────────────────────────────┘
```

| 元素 | 规格 |
| --- | --- |
| 智能整理（主按钮） | `bg-gradient-to-r from-[#BF00FF] to-[#FF1493]`，左侧 `Sparkles` 图标（`h-4 w-4 text-white`）；双行结构：标题 14px semibold + 副文案 11px `text-white/75`；hover 整体加深 `hover:from-[#A000D9] hover:to-[#D6006F]`；圆角 `rounded-lg` |
| 规则整理（次级） | 现有 outline Button，文案"规则整理"，右侧 `ChevronDown`，点击弹出 Popover 收纳原「通过标签整理」「自动创建标签」两个入口，Popover 内每项带一行说明文字（复用现有 Popover 组件） |
| 拖拽管理 | 保持现状（outline Button） |

**交互**：
- 主按钮点击 → 现有 `handleAIMove` 前置检查流程（见第 6 节）；进行中禁用并显示内联 `Loader2` 旋转；
- 所有按钮 `cursor-pointer` + `transition-colors duration-200`（现状保持）。

---

## 3. F2：Review 面板置信度分组

### 改动范围

仅改 `review-panel/index.tsx` 的 header 统计区与列表区；卡片、Select、footer 结构**不动**。

### 3.1 Header 统计 chips（现 2 个 → 4 个）

现有：`将移动 X 个` `保留 Y 个`
新增按来源细分，颜色编码：

| Chip | 样式 |
| --- | --- |
| `标签命中 X` | `bg-[#BF00FF]/10 text-[#A000D9]`，前缀 `Tag` 图标 `h-3 w-3` |
| `AI 建议 Y` | `bg-[#FF1493]/10 text-[#D6006F]`，前缀 `Sparkles` 图标 `h-3 w-3` |
| `保留 Z` | 现状 `bg-gray-100 text-gray-600` |
| 右侧链接「全选标签命中」 | 文字按钮 `text-[#A000D9] hover:underline text-xs`，标签组全部勾选后置灰隐藏 |

header 副标题文案更新："已按置信度分组：标签命中可直接确认，AI 建议请核对。"

### 3.2 分组列表

列表区由平铺改为**两个带吸顶分组头的区块**（组内顺序不变）：

```
🏷 标签命中 · 12 个（建议直接确认）          ← 分组头：sticky top-0，bg-gray-50/95 backdrop-blur
   [卡片] [卡片] ...
✨ AI 建议 · 8 个（请核对）
   [卡片] [卡片] ...
```

- 分组头：`text-xs font-medium text-gray-600 px-2 py-1.5`，左侧图标用对应语义色；某组为空时整组不渲染；
- 仅当两组都存在时才显示分组头（纯 AI 场景与现状完全一致，零打扰）。

### 3.3 结果卡片差异

卡片骨架（标题、`当前收藏夹 → Select` 三列布局）**完全沿用现有实现**，只调整"依据行"：

| 来源 | 依据行展示 |
| --- | --- |
| `source: 'tag'` | 徽标 chips：`命中标签` + 最多 2 个标签 chip（`bg-[#BF00FF]/10 text-[#A000D9] rounded-full px-2 py-0.5 text-[11px]`），超出显示 `+N`；无 Sparkles 图标 |
| `source: 'ai'` | 现状保持：粉色 `Sparkles` 图标 + reason 文字 |
| 用户手动改过目标 | 依据行追加灰色小字"已手动调整"（`text-gray-400 text-[11px]`） |
| `isFallback` | 现状保持：`bg-[#FF1493]/10 text-[#D6006F]` 警示条，文案改为"AI 未能识别目标收藏夹，请手动选择" |

**交互**：
- 标签命中卡片默认左边框高亮 `border-l-2 border-l-[#BF00FF]`，与 AI 卡片形成快速扫视差异；
- 其余 hover / focus 行为与现状一致。

### 3.4 分析中阶段文案（F2.2）

现有"AI 正在分析整理方案"进度区，文案升级为两段式：

- 标签预匹配完成后进度条上方显示一行：`标签已匹配 X 个 · AI 分析中 Y/Z 个`（`text-xs text-gray-500`，`aria-live="polite"`）；
- 全部标签命中（跳过 AI）时显示：`全部由标签匹配完成，未消耗 AI 配额`（`text-[#A000D9]`）。

---

## 4. F4：完成页标签建议卡片

### 位置

现有完成页结构（`Finished` 动画 → 统计 chips → 结果列表 → 关闭按钮）**不动**，在统计 chips 与结果列表之间插入可整体关闭的建议卡片。

### 4.1 卡片结构

```
┌────────────────────────────────────────────┐
│ 🏷 为这些收藏夹沉淀标签（下次可直接命中） [×] │  标题行：text-xs font-medium + 关闭按钮
├────────────────────────────────────────────┤
│ 「前端开发」本次移入 5 个视频：                │  收藏夹名 text-xs font-medium text-gray-700
│  [React ✓] [Hooks ✓] [前端教程 ○]           │  候选词 chips，默认全选
│                          [跳过] [采纳 2 个]  │
└────────────────────────────────────────────┘
```

| 元素 | 规格 |
| --- | --- |
| 卡片容器 | `rounded-lg border border-[#BF00FF]/25 bg-[#BF00FF]/5 p-3`，与现有警示条风格同族 |
| 候选词 chip | 可点击切换：采纳态 `bg-[#BF00FF]/15 text-[#A000D9] border border-[#BF00FF]/30` + `Check` 图标（`h-3 w-3`）；未采纳态 `bg-white text-gray-400 border border-gray-200`；`rounded-full px-2.5 py-1 text-xs cursor-pointer transition-colors duration-200` |
| 行内按钮 | 「跳过」ghost text-xs；「采纳 N 个」`bg-[#BF00FF] text-white text-xs h-7`，N=0 时禁用置灰 |
| 多个收藏夹 | 每个收藏夹一个小节，节间 `border-t border-[#BF00FF]/10 pt-2 mt-2` 分隔，最多显示 2 个收藏夹节，更多收进"展开更多"文字按钮 |
| 关闭（×） | 右上角 `X` 图标按钮（`h-6 w-6 text-gray-400 hover:text-gray-600`），关闭后本次 run 不再出现 |

### 4.2 反馈动效

- 采纳成功后该节内容原地替换为一行成功提示：`已添加 N 个标签到「前端开发」`（`text-xs text-[#A000D9]`，`animate-in fade-in duration-200`），1.5s 后该节收起；
- chip 切换仅颜色过渡 200ms，无位移/缩放（避免布局抖动）。

---

## 5. F3.4：默认收藏夹显性化（收藏夹 chip）

### 现状

收藏夹以横向换行的 chip 展示（`# 标题`，激活态青底白字），仅长按可设默认，已默认仅在 chip 内追加一个小星标，无任何文案提示。

### 新增

| 元素 | 规格 |
| --- | --- |
| 星标按钮 | chip hover 时在右侧浮现 `Star` 图标（`h-3.5 w-3.5`），默认 `text-gray-300`，hover `text-[#FF1493]`；出现动效 `opacity 0→1 duration-200`；点击设默认（复用 `use-set-default-fav`），`aria-label="设为默认收藏夹"` |
| 默认徽标 | 已是默认的收藏夹 chip：名称后常驻小徽标 `默认`（激活态 `bg-white/25 text-white`，非激活态 `bg-[#FF1493]/10 text-[#D6006F]`，`rounded px-1 text-[10px]`）；现有小星标保留 |
| 引导脉冲 | 前置检查弹引导时（见第 6 节），星标按钮附加一次性脉冲：`animate-pulse` 3 次后停止（通过 `animation-iteration-count` 控制，避免持续干扰） |

长按设置逻辑保留，不做改动。

---

## 6. F3.3：前置检查引导 Dialog

复用现有 `Dialog` 组件（shadcn），三态：

| 场景 | 标题 | 正文 | 按钮 |
| --- | --- | --- | --- |
| 未设默认收藏夹 | 先设置默认收藏夹 | "智能整理会处理**默认收藏夹**中的视频。在收藏夹标签上点击 ☆ 即可设置。" | 主按钮「去设置」→ 关闭 Dialog，滚动到收藏夹区并对星标按钮施加脉冲；次按钮「取消」 |
| 无任何标签 | 本次将全部由 AI 分析 | "还没有标签。本次整理完成后，可以把确认过的归类沉淀为标签，下次更快更省配额。" | 主按钮「开始整理」（继续流程）；次按钮「取消」 |
| 免费配额不足 | 免费配额不足 | "今日免费额度已用完。可明天再试，或配置自己的 AI 服务。" | 主按钮「配置自己的 AI」→ `options.html?tab=setting`；次按钮「取消」 |

- Dialog 宽度与现有弹窗一致（`max-w-sm`），标题 14px semibold，正文 12px `text-gray-600`；
- 无标签态为**非阻断**提示：主按钮直接继续，弱化视觉（不加警示色）。

---

## 7. 动效与无障碍汇总

| 项 | 规格 |
| --- | --- |
| 过渡时长 | hover/颜色 200ms；弹层进出 fade+zoom 200ms（沿用现有 `animate-in` 习惯） |
| 属性限制 | 仅 `opacity`/`transform`/`color`，不动画宽高 |
| reduced-motion | 脉冲、fade 均在 `motion-reduce:` 下降级为无动画 |
| 键盘 | chips 用 `button` 实现（可聚焦、Enter/Space 切换）；分组头非交互元素不加 tabindex |
| aria | 统计区 `aria-live="polite"`；chip 切换用 `aria-pressed`；星标按钮有 `aria-label` |
| 色彩不作为唯一指示 | 标签命中除颜色外还有 Tag 图标 + 左边框；采纳 chip 有 Check 图标 |

---

## 8. 验收对照（对应 PRD 第 7 节 UI 相关项）

- [ ] 底部操作区主按钮为「智能整理」，原两按钮收进「规则整理」Popover；
- [ ] Review 面板：4 个统计 chips、两组吸顶分组头、标签命中卡片紫色左边框 + 标签徽标（最多 2 个 +N）、全组为空时不渲染分组头；
- [ ] 分析中文案展示"标签已匹配 X / AI 分析中 Y/Z"，全命中时显示免配额文案；
- [ ] 完成页建议卡片：chip 可切换、采纳有成功反馈、可整体关闭、最多 2 节后折叠；
- [ ] 收藏夹 chip hover 星标按钮、默认常驻徽标、引导脉冲 3 次；
- [ ] 三种前置 Dialog 文案与跳转行为正确；
- [ ] 384px Popup 与 SidePanel 宽度下无横向滚动、无布局抖动。
