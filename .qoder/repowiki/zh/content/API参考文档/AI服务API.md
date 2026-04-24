# AI服务API

<cite>
**本文档引用的文件**
- [src/utils/api.ts](file://src/utils/api.ts)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts)
- [src/hooks/use-create-keyword/index.tsx](file://src/hooks/use-create-keyword/index.tsx)
- [src/popup/components/ai-move/use-ai-move.tsx](file://src/popup/components/ai-move/use-ai-move.tsx)
- [src/utils/message.ts](file://src/utils/message.ts)
- [src/utils/data-context.ts](file://src/utils/data-context.ts)
- [src/store/global-data.ts](file://src/store/global-data.ts)
- [src/options/components/setting/types.ts](file://src/options/components/setting/types.ts)
- [src/options/components/setting/util.ts](file://src/options/components/setting/util.ts)
- [src/options/components/setting/components/custom-config-form.tsx](file://src/options/components/setting/components/custom-config-form.tsx)
- [src/options/components/setting/components/quota-card.tsx](file://src/options/components/setting/components/quota-card.tsx)
- [src/options/components/setting/components/free-quota-panel.tsx](file://src/options/components/setting/components/free-quota-panel.tsx)
- [src/background/index.ts](file://src/background/index.ts)
- [src/utils/keyword-extractor.ts](file://src/utils/keyword-extractor.ts)
- [src/components/keyword-mode-selector/index.tsx](file://src/components/keyword-mode-selector/index.tsx)
- [src/components/keyword/index.tsx](file://src/components/keyword/index.tsx)
- [tests/ai-stream-parser.test.ts](file://tests/ai-stream-parser.test.ts)
- [tests/use-move.test.tsx](file://tests/use-move.test.tsx)
</cite>

## 更新摘要
**变更内容**
- 新增Qwen和Kimi适配器支持：在适配器工厂函数中添加了对通义千问和Kimi的支持
- 更新适配器类型支持：从['openai', 'spark', 'aigate', 'custom']扩展到['openai', 'spark', 'custom', 'qianwen', 'kimi']
- 移除AIGate相关说明：删除了AIGate免费AI服务的集成说明和相关配置
- 更新适配器工厂函数：修复了适配器类型支持，现在支持所有五种适配器类型

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件为浏览器扩展中的AI服务API综合文档，涵盖以下内容：
- OpenAI兼容模型、Qwen通义千问、Kimi和星火大模型的集成方式
- fetchChatGpt与fetchAIMove函数的使用方法、参数配置与流式响应处理
- AI配置管理（API Key、BaseURL、模型选择、适配器类型、额外参数）
- 流式处理机制（SSE连接建立、数据流解析、错误处理、连接取消）
- 多服务商对比与迁移指南（性能、价格差异与使用建议）

**重要更新**：AI智能关键词提取功能已被移除，目前仅保留本地关键词提取与AI智能移动功能。同时，AIGate免费AI服务已从系统中移除，不再提供相关集成。

## 项目结构
本项目围绕"AI服务API"构建了清晰的分层：
- 前端调用层：通过工具函数发起AI请求，并将请求封装为可读流
- 流解析层：根据适配器解析不同模型的SSE/流式响应
- 配置管理层：全局状态存储AI配置与收藏夹数据
- 设置界面层：表单校验、配额查询与配置切换
- 后台处理层：统一处理OpenAI流式请求与各AI服务商的SSE流

```mermaid
graph TB
subgraph "前端"
A["hooks/use-create-keyword/index.tsx<br/>本地关键词提取流程"]
B["popup/components/ai-move/use-ai-move.tsx<br/>AI移动分类流程"]
C["utils/api.ts<br/>fetchChatGpt/fetchAIMove"]
D["hooks/use-create-keyword-by-ai/ai-stream-parser.ts<br/>流解析适配器"]
E["utils/keyword-extractor.ts<br/>本地TF-IDF算法"]
F["components/keyword-mode-selector/index.tsx<br/>提取模式选择器"]
end
subgraph "配置与设置"
G["store/global-data.ts<br/>全局状态"]
H["utils/data-context.ts<br/>配置类型"]
I["options/components/setting/types.ts<br/>表单类型/校验"]
J["options/components/setting/util.ts<br/>适配器选项/默认参数"]
K["options/components/setting/components/custom-config-form.tsx<br/>自定义配置表单"]
L["options/components/setting/components/quota-card.tsx<br/>配额卡片"]
M["options/components/setting/components/free-quota-panel.tsx<br/>免费配额面板"]
end
subgraph "后台"
N["background/index.ts<br/>OpenAI/Qwen/Kimi流式处理"]
O["utils/message.ts<br/>消息枚举"]
end
A --> C
B --> C
C --> N
D --> A
D --> B
E --> A
G --> A
G --> B
H --> G
I --> J
K --> J
L --> N
M --> N
O --> N
```

**图表来源**
- [src/hooks/use-create-keyword/index.tsx:1-303](file://src/hooks/use-create-keyword/index.tsx#L1-L303)
- [src/popup/components/ai-move/use-ai-move.tsx:1-396](file://src/popup/components/ai-move/use-ai-move.tsx#L1-L396)
- [src/utils/api.ts:1-340](file://src/utils/api.ts#L1-L340)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:1-282](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L1-L282)
- [src/utils/keyword-extractor.ts:1-197](file://src/utils/keyword-extractor.ts#L1-L197)
- [src/components/keyword-mode-selector/index.tsx:1-49](file://src/components/keyword-mode-selector/index.tsx#L1-L49)
- [src/store/global-data.ts:1-28](file://src/store/global-data.ts#L1-L28)
- [src/utils/data-context.ts:1-34](file://src/utils/data-context.ts#L1-L34)
- [src/options/components/setting/types.ts:1-99](file://src/options/components/setting/types.ts#L1-L99)
- [src/options/components/setting/util.ts:1-46](file://src/options/components/setting/util.ts#L1-L46)
- [src/options/components/setting/components/custom-config-form.tsx:1-149](file://src/options/components/setting/components/custom-config-form.tsx#L1-L149)
- [src/options/components/setting/components/quota-card.tsx:1-199](file://src/options/components/setting/components/quota-card.tsx#L1-L199)
- [src/options/components/setting/components/free-quota-panel.tsx:1-67](file://src/options/components/setting/components/free-quota-panel.tsx#L1-L67)
- [src/background/index.ts:1-393](file://src/background/index.ts#L1-L393)
- [src/utils/message.ts:1-20](file://src/utils/message.ts#L1-L20)

**章节来源**
- [src/utils/api.ts:1-340](file://src/utils/api.ts#L1-L340)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:1-282](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L1-L282)
- [src/hooks/use-create-keyword/index.tsx:1-303](file://src/hooks/use-create-keyword/index.tsx#L1-L303)
- [src/popup/components/ai-move/use-ai-move.tsx:1-396](file://src/popup/components/ai-move/use-ai-move.tsx#L1-L396)
- [src/utils/message.ts:1-20](file://src/utils/message.ts#L1-L20)
- [src/utils/data-context.ts:1-34](file://src/utils/data-context.ts#L1-L34)
- [src/store/global-data.ts:1-28](file://src/store/global-data.ts#L1-L28)
- [src/options/components/setting/types.ts:1-99](file://src/options/components/setting/types.ts#L1-L99)
- [src/options/components/setting/util.ts:1-46](file://src/options/components/setting/util.ts#L1-L46)
- [src/options/components/setting/components/custom-config-form.tsx:1-149](file://src/options/components/setting/components/custom-config-form.tsx#L1-L149)
- [src/options/components/setting/components/quota-card.tsx:1-199](file://src/options/components/setting/components/quota-card.tsx#L1-L199)
- [src/options/components/setting/components/free-quota-panel.tsx:1-67](file://src/options/components/setting/components/free-quota-panel.tsx#L1-L67)
- [src/background/index.ts:1-393](file://src/background/index.ts#L1-L393)

## 核心组件
- AI配置类型与全局状态
  - 配置字段：API Key、BaseURL、模型、适配器、额外参数等
  - 存储位置：全局状态管理，持久化至Chrome Storage
  - **更新**：适配器类型扩展为['openai', 'spark', 'custom', 'qianwen', 'kimi']
- 流式通信桥接
  - 通过chrome.runtime.connect建立端口，将后台流式响应转换为前端ReadableStream
  - 支持取消、错误、完成事件
- 流解析适配器
  - OpenAI适配器：解析choices[0].delta.content
  - 星火适配器：解析choices[0].delta.content或reasoning_content
  - **新增**：Qwen适配器：支持通义千问模型的流式响应解析
  - **新增**：Kimi适配器：支持Kimi模型的流式响应解析
  - 自定义适配器：可扩展以支持其他模型格式
- 关键API函数
  - fetchChatGpt：基于标题数组生成关键词
  - fetchAIMove：基于视频标题与收藏夹列表进行分类移动
  - **移除**：callAIGateAI：AIGate免费服务调用（已移除）

**章节来源**
- [src/utils/data-context.ts:1-34](file://src/utils/data-context.ts#L1-L34)
- [src/store/global-data.ts:1-28](file://src/store/global-data.ts#L1-L28)
- [src/utils/api.ts:176-277](file://src/utils/api.ts#L176-L277)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:27-93](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L27-L93)

## 架构总览
整体架构采用"前端发起请求 → 后台统一处理 → 流式传输 → 前端解析"的模式，支持OpenAI兼容模型、Qwen通义千问、Kimi和星火大模型四种路径。

```mermaid
sequenceDiagram
participant UI as "前端组件"
participant API as "utils/api.ts"
participant BG as "background/index.ts"
participant OA as "OpenAI服务"
participant QW as "Qwen服务"
participant KM as "Kimi服务"
UI->>API : 调用 fetchChatGpt/fetchAIMove
API->>BG : chrome.runtime.connect 发送消息
alt 使用OpenAI模型
BG->>OA : chat.completions.create(stream=true)
OA-->>BG : SSE流 chunk
BG-->>API : port.postMessage(chunk/done/error/aborted)
else 使用Qwen通义千问
BG->>QW : chat.completions.create(stream=true)
QW-->>BG : SSE流 chunk
BG-->>API : port.postMessage(chunk/done/error/aborted)
else 使用Kimi模型
BG->>KM : chat.completions.create(stream=true)
KM-->>BG : SSE流 chunk
BG-->>API : port.postMessage(chunk/done/error/aborted)
else 使用星火大模型
BG->>BG : 使用内置适配器解析星火响应
BG-->>API : port.postMessage(chunk/done/error/aborted)
end
API-->>UI : ReadableStream 可读流
UI->>UI : 适配器解析流数据
```

**图表来源**
- [src/utils/api.ts:176-277](file://src/utils/api.ts#L176-L277)
- [src/background/index.ts:101-233](file://src/background/index.ts#L101-L233)
- [src/utils/message.ts:1-20](file://src/utils/message.ts#L1-L20)

## 详细组件分析

### 本地关键词提取功能
- 功能概述
  - 使用TF-IDF算法从视频标题中提取关键词
  - 支持停用词过滤、词频统计和评分排序
  - 提供快速提取和完整提取两种模式
- 算法实现
  - 中文分词：提取2-4字中文词组和英文单词
  - TF-IDF计算：根据词频和逆文档频率计算关键词权重
  - 停用词过滤：移除常见无意义词汇
  - 结果排序：按权重降序排列，返回前N个关键词

```mermaid
flowchart TD
Start(["开始"]) --> Tokenize["中文分词处理"]
Tokenize --> TF["计算词频(TF)"]
TF --> IDF["计算逆文档频率(IDF)"]
IDF --> Score["计算TF-IDF权重"]
Score --> Filter["过滤停用词和低分词"]
Filter --> Sort["按权重降序排序"]
Sort --> Limit["限制返回数量"]
Limit --> End(["结束"])
```

**图表来源**
- [src/utils/keyword-extractor.ts:137-187](file://src/utils/keyword-extractor.ts#L137-L187)

**章节来源**
- [src/utils/keyword-extractor.ts:1-197](file://src/utils/keyword-extractor.ts#L1-L197)
- [src/hooks/use-create-keyword/index.tsx:40-74](file://src/hooks/use-create-keyword/index.tsx#L40-L74)

### AI智能移动功能
- 函数入口
  - fetchAIMove：接收视频列表与收藏夹标题，返回可读流包装对象
- 流式通信机制
  - 前端通过connectAndStream建立端口，监听chunk/done/error/aborted事件
  - 后台使用OpenAI SDK开启流式对话，逐块推送JSON数据
- 错误与取消
  - 支持AbortController取消请求，后台检测中断并发送aborted
  - 端口断开时捕获lastError并转化为控制器错误

```mermaid
sequenceDiagram
participant Hook as "use-ai-move.tsx"
participant API as "utils/api.ts"
participant BG as "background/index.ts"
participant OA as "OpenAI SDK"
Hook->>API : fetchAIMove(videos, favoriteTitles, config)
API->>BG : type=fetchAIMove, data=config+videos
BG->>OA : chat.completions.create({stream : true})
loop 流式循环
OA-->>BG : chunk
BG-->>API : {type : "chunk", content : JSON}
API-->>Hook : ReadableStream chunk
end
BG-->>API : {type : "done"}
API-->>Hook : ReadableStream close
```

**图表来源**
- [src/popup/components/ai-move/use-ai-move.tsx:93-172](file://src/popup/components/ai-move/use-ai-move.tsx#L93-L172)
- [src/utils/api.ts:234-247](file://src/utils/api.ts#L234-L247)
- [src/background/index.ts:197-233](file://src/background/index.ts#L197-L233)

**章节来源**
- [src/utils/api.ts:234-247](file://src/utils/api.ts#L234-L247)
- [src/utils/api.ts:176-232](file://src/utils/api.ts#L176-L232)
- [src/background/index.ts:197-233](file://src/background/index.ts#L197-L233)
- [tests/use-move.test.tsx:1-607](file://tests/use-move.test.tsx#L1-L607)

### 流式处理机制与解析
- 适配器设计
  - OpenAIStreamAdapter：解析choices[0].delta.content
  - SparkStreamAdapter：解析choices[0].delta.content或reasoning_content
  - **新增**：QwenStreamAdapter：解析通义千问模型的流式响应（使用OpenAI兼容格式）
  - **新增**：KimiStreamAdapter：解析Kimi模型的流式响应（使用OpenAI兼容格式）
  - createStreamAdapter：根据配置选择适配器，**修复**：现已支持所有五种适配器类型
- 解析流程
  - processStreamChunk：累积缓冲区，尝试提取完整关键词
  - extractKeywordFromBuffer：正则匹配引号包裹的关键词
  - addKeywordToGlobalData：去重并写入全局状态
- 取消与错误
  - 前端AbortController与后端双重检查，确保及时中断
  - 控制器错误与端口断开错误均被正确传播

**更新** 适配器工厂函数已修复，现在支持所有五种适配器类型，包括新增的Qwen和Kimi支持。

```mermaid
flowchart TD
Start(["开始"]) --> ReadChunk["读取流数据块"]
ReadChunk --> Parse["适配器解析内容"]
Parse --> Skip{"是否为空/特殊字符?"}
Skip --> |是| Accumulate["累积到缓冲区"]
Skip --> |否| BufferAcc["缓冲区累加"]
BufferAcc --> Extract{"能否提取完整关键词?"}
Extract --> |否| Wait["等待更多数据"]
Extract --> |是| Dedup["去重并写入全局状态"]
Dedup --> Clear["清理已处理部分"]
Clear --> Continue["继续处理后续数据块"]
Wait --> ReadChunk
Continue --> ReadChunk
ReadChunk --> Done{"流结束?"}
Done --> |否| ReadChunk
Done --> |是| Flush["flush剩余内容"]
Flush --> End(["结束"])
```

**图表来源**
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:188-277](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L188-L277)

**章节来源**
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:27-93](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L27-L93)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:188-277](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L188-L277)

### AI配置管理
- 配置项
  - key：API Key
  - baseUrl：可选的BaseURL（用于代理或自定义网关）
  - model：模型名称（如gpt-4、deepseek-chat等）
  - extraParams：额外参数（如禁用思考过程等）
  - adapter：适配器类型（openai/spark/custom/qianwen/kimi）
  - configMode：配置模式（custom）
- 表单校验
  - custom模式：key、model、adapter必填
  - **移除**：free模式（AIGate相关配置已移除）
- 默认参数
  - spark默认包含thinking禁用配置
  - openai默认空对象
  - **新增**：qianwen和kimi默认空对象，支持通义千问和Kimi模型配置

**章节来源**
- [src/utils/data-context.ts:13-24](file://src/utils/data-context.ts#L13-L24)
- [src/options/components/setting/types.ts:30-99](file://src/options/components/setting/types.ts#L30-L99)
- [src/options/components/setting/util.ts:18-43](file://src/options/components/setting/util.ts#L18-L43)
- [src/options/components/setting/components/custom-config-form.tsx:1-149](file://src/options/components/setting/components/custom-config-form.tsx#L1-L149)

### 多服务商对比与迁移指南
- 服务商对比
  - OpenAI兼容模型
    - 优点：生态成熟、能力稳定、支持流式
    - 缺点：付费使用，成本较高
    - 适用：对质量要求高、预算充足的场景
  - **新增**：通义千问（Qwen）
    - 优点：中文能力强、性价比高、支持流式
    - 缺点：可能需要特定的API密钥
    - 适用：中文场景、预算有限的场景
  - **新增**：Kimi
    - 优点：推理能力强、支持长文本、支持流式
    - 缺点：可能需要特定的API密钥
    - 适用：需要复杂推理的场景
  - 星火大模型
    - 优点：国内访问稳定、支持reasoning_content
    - 限制：需要特定的适配器解析
    - 适用：中文场景、需要推理过程的场景
- 迁移建议
  - 从AIGate迁移到自定义模型：在设置中切换configMode为custom，填写key/model/baseUrl/extraParams
  - 参数迁移：将AIGate的messages结构映射为OpenAI兼容的消息格式
  - 适配器选择：若原AIGate返回格式与OpenAI兼容，可保持adapter为openai；否则使用spark或自定义

**章节来源**
- [src/background/index.ts:27-91](file://src/background/index.ts#L27-L91)
- [src/options/components/setting/types.ts:4-99](file://src/options/components/setting/types.ts#L4-L99)
- [src/options/components/setting/util.ts:4-46](file://src/options/components/setting/util.ts#L4-L46)

## 依赖关系分析
- 组件耦合
  - 前端组件依赖工具函数与全局状态，解耦良好
  - 流解析适配器与前端组件松耦合，通过接口抽象
- 外部依赖
  - OpenAI SDK：用于流式对话
  - Chrome Runtime：用于端口通信与消息传递
  - 设置界面：Zod表单校验、UI组件库

```mermaid
graph LR
UI1["hooks/use-create-keyword/index.tsx"] --> API1["utils/api.ts"]
UI2["popup/components/ai-move/use-ai-move.tsx"] --> API1
API1 --> BG1["background/index.ts"]
Parser["ai-stream-parser.ts"] --> UI1
Parser --> UI2
Extractor["keyword-extractor.ts"] --> UI1
Store["store/global-data.ts"] --> UI1
Store --> UI2
Types["utils/data-context.ts"] --> Store
Settings["setting/types.ts & util.ts"] --> UI1
Settings --> UI2
```

**图表来源**
- [src/hooks/use-create-keyword/index.tsx:1-303](file://src/hooks/use-create-keyword/index.tsx#L1-L303)
- [src/popup/components/ai-move/use-ai-move.tsx:1-396](file://src/popup/components/ai-move/use-ai-move.tsx#L1-L396)
- [src/utils/api.ts:1-340](file://src/utils/api.ts#L1-L340)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:1-282](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L1-L282)
- [src/utils/keyword-extractor.ts:1-197](file://src/utils/keyword-extractor.ts#L1-L197)
- [src/store/global-data.ts:1-28](file://src/store/global-data.ts#L1-L28)
- [src/utils/data-context.ts:1-34](file://src/utils/data-context.ts#L1-L34)
- [src/options/components/setting/types.ts:1-99](file://src/options/components/setting/types.ts#L1-L99)
- [src/options/components/setting/util.ts:1-46](file://src/options/components/setting/util.ts#L1-L46)

**章节来源**
- [src/utils/api.ts:1-340](file://src/utils/api.ts#L1-L340)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:1-282](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L1-L282)
- [src/hooks/use-create-keyword/index.tsx:1-303](file://src/hooks/use-create-keyword/index.tsx#L1-L303)
- [src/popup/components/ai-move/use-ai-move.tsx:1-396](file://src/popup/components/ai-move/use-ai-move.tsx#L1-L396)
- [src/utils/data-context.ts:1-34](file://src/utils/data-context.ts#L1-L34)
- [src/store/global-data.ts:1-28](file://src/store/global-data.ts#L1-L28)
- [src/options/components/setting/types.ts:1-99](file://src/options/components/setting/types.ts#L1-L99)
- [src/options/components/setting/util.ts:1-46](file://src/options/components/setting/util.ts#L1-L46)

## 性能考虑
- 流式读取
  - 使用ReadableStream逐块读取，避免一次性加载大量数据
  - 适配器解析在前端进行，减少网络传输负担
- 取消与中断
  - AbortController与后台双重检查，降低无效请求成本
- 建议
  - 对于大批量任务，优先使用自定义模型并合理设置extraParams
  - 在移动端或弱网环境下，优先使用Qwen或Kimi进行快速验证
  - **新增**：Qwen和Kimi服务响应速度快，适合实时交互场景

## 故障排除指南
- 常见问题
  - 配置不完整：检查key/model/adapter（custom模式）
  - 流解析异常：确认adapter与模型格式一致，必要时使用自定义适配器
  - 请求被取消：检查前端AbortController与后台中断信号
  - **移除**：AIGate配额不足：AIGate相关功能已移除
  - **新增**：Qwen/Kimi认证失败：检查API密钥有效性
  - **新增**：模型不支持：确认所选适配器与模型兼容
- 定位方法
  - 查看控制台日志：[DEBUG]与[AIStreamParser]输出
  - 使用测试用例：ai-stream-parser.test.ts验证connectAndStream行为
- 相关源码定位
  - 配置校验与提示：[src/options/components/setting/types.ts:52-99](file://src/options/components/setting/types.ts#L52-L99)
  - 流解析与去重：[src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:121-179](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L121-L179)
  - 取消与错误传播：[src/utils/api.ts:184-232](file://src/utils/api.ts#L184-L232)

**更新**：适配器工厂函数已修复，现在支持所有五种适配器类型，包括新增的Qwen和Kimi支持。

**章节来源**
- [src/options/components/setting/types.ts:52-99](file://src/options/components/setting/types.ts#L52-L99)
- [src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts:121-179](file://src/hooks/use-create-keyword-by-ai/ai-stream-parser.ts#L121-L179)
- [src/utils/api.ts:184-232](file://src/utils/api.ts#L184-L232)
- [src/background/index.ts:27-192](file://src/background/index.ts#L27-L192)

## 结论
本项目提供了完整的AI服务API集成方案，覆盖OpenAI兼容模型、通义千问、Kimi和星火大模型四大路径。通过统一的流式通信与解析适配器，实现了跨模型的一致体验；配合完善的配置管理，满足从个人测试到生产使用的多样化需求。**重要更新**：适配器工厂函数现已支持所有五种适配器类型，包括新增的Qwen和Kimi支持。同时，AIGate免费AI服务已从系统中移除，目前仅支持付费的AI服务提供商。建议在保证质量的前提下，优先使用自定义模型以获得更优性能与可控性，同时利用Qwen和Kimi进行低成本验证与快速迭代。

## 附录
- API函数速查
  - fetchChatGpt：关键词生成
  - fetchAIMove：视频分类移动
  - **移除**：callAIGateAI：免费服务调用（已移除）
- 适配器速查
  - openai：OpenAI兼容模型
  - spark：星火大模型
  - **新增**：qianwen：通义千问模型
  - **新增**：kimi：Kimi模型
  - custom：自定义解析逻辑
- 提取模式
  - local：本地TF-IDF算法
  - ai：AI智能关键词提取（已移除）
  - manual：手动输入（已移除）