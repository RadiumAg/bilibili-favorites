type AIProvider = 'deepseek' | 'qwen' | 'zhipu' | 'doubao' | 'xinghuo'

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
    label: 'DeepSeek（推荐）',
    provider: 'deepseek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat', description: '通用对话，10元永久额度' },
      { value: 'deepseek-coder', label: 'DeepSeek Coder', description: '代码专精' },
    ],
  },
  {
    label: '通义千问（阿里云）',
    provider: 'qwen',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo', description: '极速响应，200万tokens' },
      { value: 'qwen-plus', label: 'Qwen Plus', description: '性能均衡，200万tokens' },
      { value: 'qwen-max', label: 'Qwen Max', description: '最强性能，100万tokens' },
      { value: 'qwen-long', label: 'Qwen Long', description: '长文本支持' },
    ],
  },
  {
    label: '智谱清言',
    provider: 'zhipu',
    models: [
      { value: 'glm-4-flash', label: 'GLM-4 Flash', description: '永久免费' },
      { value: 'glm-4', label: 'GLM-4', description: '标准版，2500万tokens' },
      { value: 'glm-4-plus', label: 'GLM-4 Plus', description: '增强版' },
    ],
  },
  {
    label: '豆包（字节跳动）',
    provider: 'doubao',
    models: [
      { value: 'doubao-pro-32k', label: 'Doubao Pro 32K', description: '长文本，50万tokens永久' },
      { value: 'doubao-pro-128k', label: 'Doubao Pro 128K', description: '超长文本' },
      { value: 'doubao-lite-32k', label: 'Doubao Lite 32K', description: '轻量版' },
    ],
  },
  {
    label: '星火大模型（讯飞）',
    provider: 'xinghuo',
    models: [
      { value: 'generalv3.5', label: 'Spark 3.5', description: '推荐使用，400万tokens永久' },
      { value: 'generalv4', label: 'Spark 4.0', description: '最新版本' },
      { value: 'spark-x', label: 'spark-x', description: '稳定版' },
    ],
  },
]

export { aiProviders, type AIProvider, type AIProviderGroup, type ModelOption }
