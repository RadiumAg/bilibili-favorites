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

type FormData = {
  key: string
  baseUrl: string
  model: string
}

const formSchema = z.object({
  key: z.string(),
  baseUrl: z.string(),
  model: z.string(),
})

const Setting: React.FC = () => {
  const globalData = useGlobalConfig((state) => state)
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      key: globalData.aiConfig.key || '',
      baseUrl: globalData.aiConfig.baseUrl || '',
      model: globalData.aiConfig.model || '',
    },
  })

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    globalData.setGlobalData({
      aiConfig: {
        key: data.key,
        model: data.model,
        baseUrl: data.baseUrl,
        extraParams: {},
      },
    })
  }

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-[60%]">
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
      </form>
    </Form>
  )
}

export default Setting
