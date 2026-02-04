type AIProvider =
  | 'openai'
  | 'claude'
  | 'deepseek'
  | 'qwen'
  | 'zhipu'
  | 'doubao'
  | 'coze'
  | 'xinghuo'

type ModelOption = {
  value: string
  label: string
  description?: string
}

type AIProviderGroup = {
  label: string
  provider: AIProvider
  models: ModelOption[]
}

const aiProviders: AIProviderGroup[] = [
  {
    label: 'OpenAI',
    provider: 'openai',
    models: [
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: '经济实用' },
      { value: 'gpt-4', label: 'GPT-4', description: '性能更强' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: '更快更强' },
      { value: 'gpt-4o', label: 'GPT-4o', description: '多模态能力' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: '轻量高效' },
    ],
  },
  {
    label: 'Claude (Anthropic)',
    provider: 'claude',
    models: [
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: '快速响应' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: '平衡性能' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: '最强能力' },
      { value: 'claude-3.5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: '升级版' },
    ],
  },
  {
    label: 'DeepSeek',
    provider: 'deepseek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat', description: '通用对话' },
      { value: 'deepseek-coder', label: 'DeepSeek Coder', description: '代码专精' },
    ],
  },
  {
    label: '通义千问 (阿里云)',
    provider: 'qwen',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo', description: '极速响应' },
      { value: 'qwen-plus', label: 'Qwen Plus', description: '性能均衡' },
      { value: 'qwen-max', label: 'Qwen Max', description: '最强性能' },
      { value: 'qwen-long', label: 'Qwen Long', description: '长文本支持' },
    ],
  },
  {
    label: '智谱清言',
    provider: 'zhipu',
    models: [
      { value: 'glm-4-flash', label: 'GLM-4 Flash', description: '快速免费' },
      { value: 'glm-4', label: 'GLM-4', description: '标准版' },
      { value: 'glm-4-plus', label: 'GLM-4 Plus', description: '增强版' },
    ],
  },
  {
    label: '豆包 (字节跳动)',
    provider: 'doubao',
    models: [
      { value: 'doubao-pro-32k', label: 'Doubao Pro 32K', description: '长文本' },
      { value: 'doubao-pro-128k', label: 'Doubao Pro 128K', description: '超长文本' },
      { value: 'doubao-lite-32k', label: 'Doubao Lite 32K', description: '轻量版' },
    ],
  },
  {
    label: 'Coze',
    provider: 'coze',
    models: [{ value: 'coze-chat', label: 'Coze Chat', description: '对话模型' }],
  },
  {
    label: '星火大模型 (讯飞)',
    provider: 'xinghuo',
    models: [
      { value: 'generalv3.5', label: 'Spark 3.5', description: '推荐使用' },
      { value: 'generalv4', label: 'Spark 4.0', description: '最新版本' },
      { value: 'spark-x', label: 'spark-x', description: '稳定版' },
    ],
  },
]

export { aiProviders, type AIProvider, type AIProviderGroup, type ModelOption }
