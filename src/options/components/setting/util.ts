import * as React from 'react'
import { Adapter } from '@/utils/data-context'

const adapterArray: [Adapter, Adapter, Adapter] = ['openai', 'spark', 'aigate']

const selectItemsArray: { label: string; value: Adapter; help?: React.ReactNode }[] = [
  {
    label: '星火大模型',
    value: 'spark',
    help: '推荐当前星火大模型，有免费额度',
  },
  {
    label: 'OpenAi',
    value: 'openai',
  },
  {
    label: 'AIGate 免费大模型',
    value: 'aigate',
    help: '通过 AIGate 网关调用多种免费大模型',
  },
]

const defaultExtraParams: Record<Adapter, Record<string, any>> = {
  spark: { thinking: { type: 'disabled' } },
  openai: {},
  aigate: {
    provider: 'deepseek',
    temperature: 0.7,
    max_tokens: 2000,
  },
  custom: {},
}

export type { Adapter }
export { defaultExtraParams, adapterArray, selectItemsArray }
