import { z } from 'zod'
import { Adapter, adapterArray } from './util'

export type QuotaInfo = {
  daily: {
    limit: number
    used: number
    remaining: number
  }
  monthly: {
    limit: number
    used: number
    remaining: number
  }
  rpm: {
    limit: number
    used: number
    remaining: number
  }
}

export type QuotaCheckResult = {
  hasQuota: boolean
  quotaInfo: QuotaInfo
  message: string
}

export type FormData = {
  key: string
  baseUrl: string
  model: string
  extraParams: string
  adapter: Adapter
  aigateUserId?: string
  aigateApiKeyId?: string
}

export const formSchema = z
  .object({
    key: z.string().optional(),
    baseUrl: z.string().optional(),
    model: z.string().optional(),
    extraParams: z.string().optional(),
    adapter: z.enum(adapterArray).optional(),
    aigateUserId: z.string().optional(),
    aigateApiKeyId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['key'],
        message: 'API Key 是必填项',
      })
    }
    if (!data.model) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['model'],
        message: '模型名称是必填项',
      })
    }
    if (!data.adapter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adapter'],
        message: '请选择 AI 模型',
      })
    }
  })
