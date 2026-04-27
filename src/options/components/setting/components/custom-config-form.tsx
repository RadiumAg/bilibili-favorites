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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Adapter, defaultParams, selectItemsArray } from '../util'
import { z } from 'zod'
import { useGlobalConfig } from '@/store/global-data'
import { toast } from '@/hooks/use-toast'
import { useShallow } from 'zustand/react/shallow'
import type { formSchema as formSchemaType } from '../types'
import { useMemoizedFn } from 'ahooks'

type FormData = z.infer<typeof formSchemaType>

export const CustomConfigForm: React.FC = () => {
  const globalData = useGlobalConfig(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      setGlobalData: state.setGlobalData,
    })),
  )
  const [showApiKey, setShowApiKey] = React.useState(false)
  const form = useForm<FormData>({
    defaultValues: {
      key: globalData.aiConfig.key || '',
      baseUrl: globalData.aiConfig.baseUrl || '',
      model: globalData.aiConfig.model || '',
      extraParams: globalData.aiConfig.extraParams
        ? JSON.stringify(globalData.aiConfig.extraParams)
        : '',
      adapter: globalData.aiConfig.adapter || 'qianwen',
      aigateUserId: globalData.aiConfig.aigateUserId || '',
      aigateApiKeyId: globalData.aiConfig.aigateApiKeyId || '',
    },
  })
  const adapter = form.getValues('adapter')
  const isExtraParamsDisabled = adapter !== 'custom'

  const handleSubmit = useMemoizedFn((data: z.infer<typeof formSchemaType>) => {
    try {
      globalData.setGlobalData({
        aiConfig: {
          ...globalData.aiConfig,
          key: data.key,
          model: data.model,
          baseUrl: data.baseUrl,
          adapter: data.adapter as Adapter,
          aigateUserId: data.aigateUserId,
          aigateApiKeyId: data.aigateApiKeyId,
          extraParams: data.extraParams ? JSON.parse(data.extraParams) : {},
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
  })

  React.useEffect(() => {
    if (globalData.aiConfig.adapter == null) return
    const defaultParamsValue = defaultParams[globalData.aiConfig.adapter]

    for (const [key, value] of Object.entries(defaultParamsValue)) {
      if (key === 'extraParams') {
        form.setValue(key as any, value)
      } else {
        form.setValue(key as any, value)
      }
    }

    globalData.setGlobalData({
      aiConfig: {
        ...globalData.aiConfig,
        ...defaultParamsValue,
        ...{
          extraParams: JSON.parse(defaultParamsValue.extraParams || '{}'),
        },
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalData.aiConfig.adapter])

  const adapterSelectItemEleArray = React.useMemo(() => {
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
  }, [])

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-full md:w-[60%]">
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
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="输入 API Key"
                    {...field}
                  />
                  <button
                    onClick={() => {
                      setShowApiKey((oldValue) => !oldValue)
                    }}
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                    aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
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
          disabled={isExtraParamsDisabled}
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Extra Params</FormLabel>
                <FormControl>
                  <Textarea placeholder="输入其它参数，例如调整跳过思考过程" {...field} />
                </FormControl>
                <FormDescription>其它参数</FormDescription>
                <FormMessage />
              </FormItem>
            )
          }}
        />
      </form>
    </Form>
  )
}
