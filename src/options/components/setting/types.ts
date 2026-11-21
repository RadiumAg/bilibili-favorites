import { z } from 'zod'

export const adapterArray = ['openai', 'spark', 'custom', 'qianwen', 'kimi', 'gml'] as const

export const formSchema = z
  .object({
    key: z.string().optional(),
    baseUrl: z.string().optional(),
    model: z.string().optional(),
    extraParams: z.string().optional(),
    adapter: z.enum(adapterArray).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.key) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['key'], message: 'API Key 是必填项' })
    }
    if (!data.model) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['model'], message: '模型名称是必填项' })
    }
    if (!data.baseUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['baseUrl'], message: 'Base URL 是必填项' })
    } else {
      try {
        const url = new URL(data.baseUrl)
        if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['baseUrl'], message: '请输入有效的 http/https URL' })
      }
    }
    if (!data.adapter) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adapter'], message: '请选择 AI 模型' })
    }
  })
