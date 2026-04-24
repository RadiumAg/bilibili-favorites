import * as React from 'react'
import { Adapter } from '@/utils/data-context'

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
    label: '自定义',
    value: 'custom',
  },
]

const defaultExtraParams: Record<Adapter, Record<string, any>> = {
  spark: { thinking: { type: 'disabled' } },
  openai: {},
  custom: {},
  aigate: {},
  qianwen: {},
  kimi: {},
}

export type { Adapter }
export { defaultExtraParams, adapterArray, selectItemsArray }
