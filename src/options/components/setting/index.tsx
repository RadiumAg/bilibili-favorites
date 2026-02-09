import React, { useEffect, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Adapter, adapterArray, defaultExtraParams, selectItemsArray } from './util'
import { Badge } from '@/components/ui/badge'
import { useShallow } from 'zustand/react/shallow'

type FormData = {
  key: string
  baseUrl: string
  model: string
  extraParams: string
  adapter: Adapter
}

const formSchema = z.object({
  key: z.string(),
  baseUrl: z.string(),
  model: z.string(),
  extraParams: z.string().optional(),
  adapter: z.enum(adapterArray),
})

const Setting: React.FC = () => {
  const globalData = useGlobalConfig(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      setGlobalData: state.setGlobalData,
    })),
  )
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
  const adapterSelectItemEleArray = useMemo(() => {
    return selectItemsArray.map((adapterName, index) => {
      const { value, label, help } = adapterName

      return (
        <SelectItem value={value} key={index}>
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {help && <Badge>{help}</Badge>}
          </div>
        </SelectItem>
      )
    })
  }, [selectItemsArray])

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

  // 监听适配器变化，自动填充 Extra Params
  useEffect(() => {
    if (globalData.aiConfig.adapter == null) return
    const currentExtraParams = form.getValues('extraParams')
    const defaultParams = defaultExtraParams[globalData.aiConfig.adapter]
    // 如果当前 Extra Params 为空，自动填充
    if (!currentExtraParams || currentExtraParams.trim() === '') {
      form.setValue('extraParams', JSON.stringify(defaultParams))
    }
  }, [globalData.aiConfig.adapter])

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-[60%]">
        <FormField
          control={form.control}
          name="adapter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI 模型</FormLabel>
              <Select {...field} onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择 AI 模型" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>{adapterSelectItemEleArray}</SelectContent>
              </Select>
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
