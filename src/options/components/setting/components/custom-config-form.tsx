import React from 'react'
import {
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
import { UseFormReturn } from 'react-hook-form'
import { selectItemsArray } from '../util'

interface CustomConfigFormProps {
  form: UseFormReturn<any>
  showApiKey: boolean
  onToggleApiKeyVisibility: () => void
}

export const CustomConfigForm: React.FC<CustomConfigFormProps> = ({
  form,
  showApiKey,
  onToggleApiKeyVisibility,
}) => {
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
  }, [selectItemsArray])

  return (
    <>
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
                  type="button"
                  onClick={onToggleApiKeyVisibility}
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
    </>
  )
}
