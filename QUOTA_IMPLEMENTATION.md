# AI API 每日配额功能实现文档

## 功能概述

实现了完整的 AI API 每日配额管理系统，包括：
- ✅ 每日配额限制和自动重置
- ✅ 配额使用追踪
- ✅ 实时配额显示组件
- ✅ 配额设置界面
- ✅ API 调用前自动检查配额

## 文件结构

```
src/
├── utils/
│   ├── quota.ts                    # 配额管理核心工具
│   └── api.ts                      # 已集成配额检查
├── hooks/
│   └── use-quota/
│       └── index.tsx               # 配额管理 React Hook
├── components/
│   ├── quota-indicator/
│   │   └── index.tsx               # 配额指示器组件
│   ├── quota-settings/
│   │   └── index.tsx               # 配额设置组件
│   └── ui/
│       ├── progress.tsx            # 进度条组件（新增）
│       ├── badge.tsx               # 徽章组件（新增）
│       └── slider.tsx              # 滑块组件（新增）
```

## 核心功能

### 1. 配额管理工具 (`src/utils/quota.ts`)

提供完整的配额管理 API：

```typescript
// 获取配额使用情况
const usage = await getQuotaUsage()

// 检查是否还有配额
const hasQuota = await hasQuota()

// 使用配额（调用 API 前）
const success = await useQuota()
if (!success) {
  // 配额已用完
}

// 获取剩余配额
const remaining = await getRemainingQuota()

// 设置配额配置
await setQuotaConfig({
  dailyLimit: 100,
  warningThreshold: 80
})
```

**特性：**
- 每天 0 点自动重置
- 数据持久化到 Chrome Storage
- 支持自定义每日限制和警告阈值

### 2. React Hook (`src/hooks/use-quota/index.tsx`)

方便在组件中使用配额功能：

```typescript
const {
  usage,          // 配额使用情况
  config,         // 配额配置
  remaining,      // 剩余配额
  percentage,     // 使用百分比
  hasQuota,       // 是否还有配额
  shouldWarn,     // 是否需要警告
  loading,        // 加载状态
  useQuota,       // 使用配额
  refreshUsage,   // 刷新使用情况
  resetQuota,     // 重置配额
  updateConfig,   // 更新配置
} = useQuotaManagement()
```

**特性：**
- 自动监听 Storage 变化
- 每分钟自动检查是否跨天
- 实时更新 UI

### 3. 配额指示器组件 (`src/components/quota-indicator/index.tsx`)

显示当前配额使用情况：

```typescript
// 完整模式
<QuotaIndicator showDetails={true} />

// 紧凑模式
<QuotaIndicator compact={true} />
```

**显示内容：**
- 剩余配额数量
- 使用进度条
- 状态图标和颜色
- 重置时间
- 警告提示

### 4. 配额设置组件 (`src/components/quota-settings/index.tsx`)

配置配额参数：

```typescript
<QuotaSettings />
```

**可配置项：**
- 每日调用限制（1-10000 次）
- 警告阈值（50%-95%）
- 手动重置功能

### 5. API 集成 (`src/utils/api.ts`)

`fetchChatGpt` 函数已自动集成配额检查：

```typescript
const fetchChatGpt = async (titleArray: string[], config: AIConfig) => {
  // 自动检查并使用配额
  const hasQuota = await useQuota()
  if (!hasQuota) {
    throw new Error('今日 AI 调用配额已用完，请明天再试或调整配额设置')
  }
  
  // 继续 API 调用...
}
```

## 使用示例

### 在 Options 页面添加配额设置

```typescript
// src/options/Options.tsx
import { QuotaSettings } from '@/components/quota-settings'

const Options: React.FC = () => {
  return (
    <TabWrapper>
      <TabWrapper.Tab title="配额管理" keyValue="quota">
        <TabWrapper.Content>
          <QuotaSettings />
        </TabWrapper.Content>
      </TabWrapper.Tab>
    </TabWrapper>
  )
}
```

### 在 Popup 显示配额状态

```typescript
// src/popup/Popup.tsx
import QuotaIndicator from '@/components/quota-indicator'

const Popup: React.FC = () => {
  return (
    <div>
      {/* 紧凑模式显示在顶部 */}
      <QuotaIndicator compact={true} />
      
      {/* 或完整模式显示详细信息 */}
      <QuotaIndicator showDetails={true} />
    </div>
  )
}
```

### 手动使用配额

```typescript
import { useQuotaManagement } from '@/hooks/use-quota'

const MyComponent: React.FC = () => {
  const { hasQuota, useQuota } = useQuotaManagement()
  
  const handleAICall = async () => {
    if (!hasQuota) {
      toast({
        title: '配额不足',
        description: '今日 AI 调用配额已用完',
        variant: 'destructive'
      })
      return
    }
    
    // 使用配额
    const success = await useQuota()
    if (success) {
      // 调用 AI API
    }
  }
  
  return <button onClick={handleAICall}>调用 AI</button>
}
```

## 数据存储

配额数据存储在 Chrome Storage Local 中：

```typescript
// 配额使用情况
{
  ai_quota_usage: {
    date: "2025-02-05",
    used: 25,
    limit: 100,
    lastResetTime: 1738713600000
  }
}

// 配额配置
{
  aiQuotaConfig: {
    dailyLimit: 100,
    warningThreshold: 80
  }
}
```

## 配额重置机制

1. **自动重置**：每天 0 点自动重置
2. **跨天检测**：Hook 每分钟检查一次日期
3. **手动重置**：用户可在设置中手动重置

## 状态和颜色

| 状态 | 颜色 | 条件 |
|------|------|------|
| 正常 | 绿色 | 使用量 < 警告阈值 |
| 警告 | 黄色 | 使用量 ≥ 警告阈值 |
| 用完 | 红色 | 使用量 ≥ 配额限制 |

## 错误处理

当配额用完时，`fetchChatGpt` 会抛出错误：

```typescript
try {
  await fetchChatGpt(titles, config)
} catch (error) {
  if (error.message.includes('配额已用完')) {
    // 显示配额用完提示
    toast({
      title: '配额不足',
      description: error.message,
      variant: 'destructive'
    })
  }
}
```

## 建议的配额设置

根据不同 AI 服务商的免费额度：

| 服务商 | 免费额度 | 建议每日限制 |
|--------|---------|-------------|
| DeepSeek | 10元永久 | 50-100次 |
| 通义千问 | 500万tokens | 200-300次 |
| 智谱AI | 2500万tokens | 300-500次 |
| 豆包 | 300万tokens | 100-200次 |
| 讯飞星火 | 400万tokens | 150-250次 |

## 注意事项

1. **配额检查时机**：在 API 调用前自动检查，无需手动处理
2. **配额消耗**：每次调用 `fetchChatGpt` 自动消耗 1 次配额
3. **跨天重置**：0 点自动重置，无需手动操作
4. **配置持久化**：所有配置自动保存到 Chrome Storage

## 未来扩展

可以考虑添加的功能：

1. **配额统计**：记录每日使用历史
2. **配额预警**：接近限制时提前通知
3. **多服务商配额**：为不同 AI 服务商设置独立配额
4. **配额购买**：集成付费配额购买功能
5. **配额分享**：团队成员间共享配额

## 总结

该配额系统提供了完整的 AI API 调用管理功能，包括：
- ✅ 自动配额检查和消耗
- ✅ 实时配额显示
- ✅ 灵活的配置选项
- ✅ 友好的用户界面
- ✅ 完善的错误处理

所有功能已完整实现，可直接在项目中使用！
