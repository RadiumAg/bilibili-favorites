import * as React from 'react'
import { Adapter } from '@/utils/data-context'
import { formSchema } from './types'
import { z } from 'zod'

const adapterArray: [Adapter, Adapter, Adapter, Adapter, Adapter, Adapter] = [
  'openai',
  'spark',
  'aigate',
  'custom',
  'qianwen',
  'kimi',
]

const selectItemsArray: { label: string; value: Adapter; help?: React.ReactNode }[] = [
  {
    label: '通义千问',
    value: 'qianwen',
  },
  {
    label: 'Kimi',
    value: 'kimi',
  },
  {
    label: '星火大模型',
    value: 'spark',
  },
  {
    label: 'OpenAi',
    value: 'openai',
  },
  {
    label: 'GML',
    value: 'gml',
  },
  {
    label: '自定义',
    value: 'custom',
  },
]

const defaultParams: Record<Adapter, Omit<z.infer<typeof formSchema>, 'configMode'>> = {
  spark: {
    baseUrl: 'https://spark-api-open.xf-yun.com/v1/',
    extraParams: JSON.stringify({
      thinking: { type: 'disabled' },
    }),
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    extraParams: JSON.stringify({
      chat_template_kwargs: { enable_thinking: false },
    }),
  },
  qianwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    extraParams: JSON.stringify({
      chat_template_kwargs: { enable_thinking: false },
    }),
  },
  kimi: {
    baseUrl: 'https://api.moonshot.ai/v1',
    extraParams: JSON.stringify({
      thinking: {
        type: 'disabled',
        keep: 'null',
      },
    }),
  },
  gml: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    extraParams: JSON.stringify({
      thinking: {
        type: 'disabled',
      },
    }),
  },
  custom: {},
  aigate: {},
}

export type { Adapter }
export { defaultParams, adapterArray, selectItemsArray }
