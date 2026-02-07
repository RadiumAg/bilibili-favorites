import React from 'react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { useGlobalConfig } from '@/store/global-data'
import { useIsFirstRun } from '@/hooks'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FormData = {
  key: string
  baseUrl: string
  model: string
  extraParams: string
  adapter: 'spark' | 'openai' | 'custom'
}

const formSchema = z.object({
  key: z.string(),
  baseUrl: z.string(),
  model: z.string(),
  extraParams: z.string().optional(),
  adapter: z.enum(['spark', 'openai', 'custom']),
})

const Setting: React.FC = () => {
  const globalData = useGlobalConfig((state) => state)
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      key: globalData.aiConfig.key || '',
      baseUrl: globalData.aiConfig.baseUrl || '',
      model: globalData.aiConfig.model || '',
      extraParams: globalData.aiConfig.extraParams
        ? JSON.stringify(globalData.aiConfig.extraParams)
        : '',
      adapter: globalData.aiConfig.adapter || 'spark',
    },
  })

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('[DEBUG] submit data', data)
    try {
      globalData.setGlobalData({
        aiConfig: {
          key: data.key,
          model: data.model,
          baseUrl: data.baseUrl,
          extraParams: data.extraParams ? JSON.parse(data.extraParams) : {},
          adapter: data.adapter,
        },
      })
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: 'destructive',
          title: `哪里不对哦`,
          description: e.message,
        })
      }
    }

    toast({ variant: 'default', title: 'ok没问题' })
  }

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-[60%]">
        <FormField
          control={form.control}
          name="adapter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI 模型适配器</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择 AI 模型适配器" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="spark">星火大模型</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>选择 AI 模型适配器，不同适配器对应不同的流式响应格式</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>模型</FormLabel>
              <FormControl>
                <Input placeholder="输入模型名称，如：deepseek-chat" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type="password" placeholder="输入 API Key" {...field} />
              </FormControl>
              <FormDescription>从对应服务商获取 API Key</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL (可选)</FormLabel>
              <FormControl>
                <Input placeholder="自定义 Base URL" {...field} />
              </FormControl>
              <FormDescription>默认使用官方地址，如有自定义代理可填写</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="extraParams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Extra Params</FormLabel>
              <FormControl>
                <Textarea placeholder="输入其它参数，例如调整跳过思考过程" {...field} />
              </FormControl>
              <FormDescription>其它参数</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default Setting
