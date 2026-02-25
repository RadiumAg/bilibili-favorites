import * as React from 'react'
import { Adapter } from '@/utils/data-context'

const adapterArray: [Adapter, Adapter] = ['openai', 'spark']

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
]

const defaultExtraParams: Record<Adapter, Record<string, any>> = {
  spark: { thinking: { type: 'disabled' } },
  openai: {},
  custom: {},
}

export type { Adapter }
export { defaultExtraParams, adapterArray, selectItemsArray }
