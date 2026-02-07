# AI 适配器模式说明

## 概述

AI 流式解析采用适配器模式，支持多种 AI 模型的流式响应格式解析。

## 适配器类型

目前支持以下适配器：

1. **SparkStreamAdapter** - 星火大模型适配器（默认）
   - 解析 `choices[0].delta.content` 和 `choices[0].delta.reasoning_content`
   - `content` 字段优先级高于 `reasoning_content`

2. **OpenAIStreamAdapter** - OpenAI 兼容适配器
   - 解析 `choices[0].delta.content`
   - 适用于 OpenAI、Anthropic 等 OpenAI 兼容模型

3. **Custom** - 自定义适配器
   - 默认使用 OpenAI 兼容的解析逻辑
   - 可扩展为从配置中读取自定义解析函数

## 使用方法

### 1. 配置页面选择适配器

在"配置"页面的"AI 模型适配器"下拉框中选择适配器类型。

### 2. 创建适配器

```typescript
import { createStreamAdapter } from '@/hooks/use-create-keyword-by-ai/ai-stream-parser'

// 创建适配器
const adapter = createStreamAdapter('spark') // 或 'openai'、'custom'
```

### 3. 在解析器中使用

```typescript
import { createAIStreamParser } from '@/hooks/use-create-keyword-by-ai/ai-stream-parser'

const parser = createAIStreamParser({
  favKey,
  getGlobalData: () => dataProvideData.getGlobalData(),
  setGlobalData: (data) => dataProvideData.setGlobalData(data),
  adapter, // 传入适配器
})
```

## 扩展新适配器

1. 实现 `AIStreamAdapter` 接口：

```typescript
export class NewModelAdapter implements AIStreamAdapter {
  parse(chunk: Uint8Array): string {
    // 实现特定的解析逻辑
  }
}
```

2. 在 `createStreamAdapter` 中添加对应的分支：

```typescript
export function createStreamAdapter(adapterType: 'spark' | 'openai' | 'custom' | 'newmodel'): AIStreamAdapter {
  switch (adapterType) {
    case 'newmodel':
      return new NewModelAdapter()
    // ... 其他分支
  }
}
```

3. 在配置表单中添加新的选项：

```typescript
<SelectItem value="newmodel">新模型</SelectItem>
```

## 测试

运行适配器测试：

```bash
npx vitest run tests/ai-stream-adapter.test.ts
```

运行所有测试：

```bash
npx vitest run
```
