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
import { Eye, EyeOff, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

type FormData = {
  key: string
  baseUrl: string
  model: string
  extraParams: string
  adapter: Adapter
  // 新增 AIGate 配置
  aigateUserId?: string
  aigateApiKeyId?: string
  // 新增配置模式选择
  configMode: 'custom' | 'free' // custom: 自定义配置, free: 免费额度
}

// 配额信息类型
type QuotaInfo = {
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

// 配额检查结果类型
type QuotaCheckResult = {
  hasQuota: boolean
  quotaInfo: QuotaInfo
  message: string
}

const formSchema = z
  .object({
    // 基础字段设为可选，根据模式动态验证
    key: z.string().optional(),
    baseUrl: z.string().optional(),
    model: z.string().optional(),
    extraParams: z.string().optional(),
    adapter: z.enum(adapterArray).optional(),
    // AIGate 字段设为可选
    aigateUserId: z.string().optional(),
    aigateApiKeyId: z.string().optional(),
    // 配置模式验证
    configMode: z.enum(['custom', 'free']),
  })
  .superRefine((data, ctx) => {
    // 根据配置模式进行动态验证
    if (data.configMode === 'custom') {
      // 自定义模式需要这些字段
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
    } else if (data.configMode === 'free') {
      // 免费模式需要这些字段
      if (!data.aigateUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['aigateUserId'],
          message: '用户邮箱是必填项',
        })
      }
      if (!data.aigateApiKeyId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['aigateApiKeyId'],
          message: 'API Key ID 是必填项',
        })
      }
      if (!data.model) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['model'],
          message: '模型名称是必填项',
        })
      }
    }
  })

const Setting: React.FC = () => {
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [showAIGateKey, setShowAIGateKey] = React.useState(false)
  const [quotaInfo, setQuotaInfo] = React.useState<QuotaInfo | null>(null)
  const [checkingQuota, setCheckingQuota] = React.useState(false)
  const [lastCheckTime, setLastCheckTime] = React.useState<string>('')
  const [configMode, setConfigMode] = React.useState<'custom' | 'free'>('custom')

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
      // AIGate 配置默认值
      aigateUserId: globalData.aiConfig.aigateUserId || '',
      aigateApiKeyId: globalData.aiConfig.aigateApiKeyId || '',
      // 配置模式默认值
      configMode: globalData.aiConfig.configMode || 'custom',
    },
  })
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
          aigateUserId: data.aigateUserId,
          aigateApiKeyId: data.aigateApiKeyId,
          configMode: data.configMode,
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

  // 检查配额的函数
  const checkQuota = async () => {
    const userId = form.getValues('aigateUserId')
    const apiKeyId = form.getValues('aigateApiKeyId')

    if (!userId || !apiKeyId) {
      toast({
        variant: 'destructive',
        title: '配置缺失',
        description: '请先填写 AIGate 用户ID 和 API Key ID',
      })
      return
    }

    setCheckingQuota(true)
    try {
      // 通过 background script 调用 AIGate API
      const port = chrome.runtime.connect({ name: 'ai-stream' })

      // 发送配额检查请求
      port.postMessage({
        type: 'checkAIGateQuota',
        data: { userId, apiKeyId },
      })

      // 监听响应
      port.onMessage.addListener((response) => {
        if (response.type === 'quota-result') {
          const { quotaInfo, message } = response.data
          setQuotaInfo(quotaInfo)
          setLastCheckTime(new Date().toLocaleString())

          toast({
            variant: 'default',
            title: '配额检查成功',
            description: message,
          })
          port.disconnect()
          setCheckingQuota(false)
        } else if (response.type === 'error') {
          toast({
            variant: 'destructive',
            title: '配额检查失败',
            description: response.error,
          })
          port.disconnect()
          setCheckingQuota(false)
        }
      })

      // 设置超时处理
      setTimeout(() => {
        if (checkingQuota) {
          port.disconnect()
          setCheckingQuota(false)
          toast({
            variant: 'destructive',
            title: '请求超时',
            description: '配额检查请求超时',
          })
        }
      }, 10000) // 10秒超时
    } catch (error) {
      console.error('配额检查失败:', error)
      setCheckingQuota(false)
      toast({
        variant: 'destructive',
        title: '配额检查失败',
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  // 测试 AI 调用的函数
  const testAICall = async () => {
    const userId = form.getValues('aigateUserId')
    const apiKeyId = form.getValues('aigateApiKeyId')

    if (!userId || !apiKeyId) {
      toast({
        variant: 'destructive',
        title: '配置缺失',
        description: '请先完善 AIGate 配置和模型设置',
      })
      return
    }

    try {
      // 通过 background script 调用 AIGate AI
      const port = chrome.runtime.connect({ name: 'ai-stream' })

      // 发送 AI 调用请求
      port.postMessage({
        type: 'callAIGateAI',
        data: {
          userId,
          apiKeyId,
          model: 'spark-x',
          messages: [{ role: 'user', content: '你好，请简单介绍一下你自己' }],
          temperature: 0.7,
        },
      })

      // 监听响应
      port.onMessage.addListener((response) => {
        if (response.type === 'ai-result') {
          if (response.data.success) {
            toast({
              variant: 'default',
              title: 'AI 调用测试成功',
              description: '可以正常使用免费限额的大模型服务',
            })
          } else {
            toast({
              variant: 'destructive',
              title: 'AI 调用失败',
              description: response.data.error,
            })
          }
          port.disconnect()
        } else if (response.type === 'error') {
          toast({
            variant: 'destructive',
            title: 'AI 调用失败',
            description: response.error,
          })
          port.disconnect()
        }
      })

      // 设置超时处理
      setTimeout(() => {
        port.disconnect()
        toast({
          variant: 'destructive',
          title: '请求超时',
          description: 'AI 调用请求超时',
        })
      }, 15000) // 15秒超时
    } catch (error) {
      console.error('AI 调用测试失败:', error)
      toast({
        variant: 'destructive',
        title: 'AI 调用测试失败',
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  // 监听适配器变化，自动填充 Extra Params
  React.useEffect(() => {
    if (globalData.aiConfig.adapter == null) return
    const currentExtraParams = form.getValues('extraParams')
    const defaultParams = defaultExtraParams[globalData.aiConfig.adapter]
    // 如果当前 Extra Params 为空，自动填充
    if (!currentExtraParams || currentExtraParams.trim() === '') {
      form.setValue('extraParams', JSON.stringify(defaultParams))
    }
  }, [globalData.aiConfig.adapter])

  // 渲配额信息卡片的函数
  const renderQuotaCard = () => {
    if (!quotaInfo) return null

    const dailyUsagePercent = quotaInfo.daily.limit > 0 
      ? (quotaInfo.daily.used / quotaInfo.daily.limit) * 100 
      : 0
    const rpmUsagePercent = quotaInfo.rpm.limit > 0 
      ? (quotaInfo.rpm.used / quotaInfo.rpm.limit) * 100 
      : 0

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            配额使用情况
            {lastCheckTime && (
              <span className="text-sm font-normal text-muted-foreground">
                (最后更新: {lastCheckTime})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 日配额 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">今日请求配额</span>
              <span
                className={`text-sm ${
                  quotaInfo.daily.remaining > quotaInfo.daily.limit * 0.2
                    ? 'text-green-600'
                    : quotaInfo.daily.remaining > 0
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {quotaInfo.daily.remaining}/{quotaInfo.daily.limit} 次请求
              </span>
            </div>
            <Progress value={dailyUsagePercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>已使用: {quotaInfo.daily.used} 次</span>
              <span>剩余: {quotaInfo.daily.remaining} 次</span>
            </div>
          </div>

          {/* RPM 限制 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">请求频率限制</span>
              <span className="text-sm text-muted-foreground">
                {quotaInfo.rpm.remaining}/{quotaInfo.rpm.limit} RPM
              </span>
            </div>
            <Progress value={rpmUsagePercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>限制: {quotaInfo.rpm.limit} 次/分钟</span>
              <span>当前可用: {quotaInfo.rpm.remaining} 次/分钟</span>
            </div>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">服务正常</span>
            </div>
            {quotaInfo.daily.remaining === 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">今日配额已用完</span>
              </div>
            )}
            {quotaInfo.daily.remaining > 0 && quotaInfo.daily.remaining < quotaInfo.daily.limit * 0.2 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">配额即将用完</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-[60%]">
          {/* 配置模式选择 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">AI 配置模式</h3>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={configMode === 'custom' ? 'default' : 'outline'}
                onClick={() => {
                  setConfigMode('custom')
                  form.setValue('configMode', 'custom')
                }}
                className="flex-1"
              >
                <div className="text-left">
                  <div className="font-medium">自定义配置</div>
                  <div className="text-xs opacity-75">使用自己的 API Key</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={configMode === 'free' ? 'default' : 'outline'}
                onClick={() => {
                  setConfigMode('free')
                  form.setValue('configMode', 'free')
                }}
                className="flex-1"
              >
                <div className="text-left">
                  <div className="font-medium">免费额度</div>
                  <div className="text-xs opacity-75">使用 AIGate 免费大模型</div>
                </div>
              </Button>
            </div>
          </div>

          {/* 自定义配置部分 - 仅在 custom 模式下显示 */}
          {configMode === 'custom' && (
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
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
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
          )}

          {/* 免费额度配置部分 - 仅在 free 模式下显示 */}
          {configMode === 'free' && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge variant="secondary">AIGate 免费大模型</Badge>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="aigateUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户邮箱</FormLabel>
                      <FormControl>
                        <Input placeholder="your-email@example.com" {...field} />
                      </FormControl>
                      <FormDescription>用于身份验证的邮箱地址</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aigateApiKeyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showAIGateKey ? 'text' : 'password'}
                            placeholder="输入 API Key ID"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAIGateKey(!showAIGateKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showAIGateKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormDescription>从 AIGate 控制台获取的 API Key ID</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  type="button"
                  onClick={checkQuota}
                  disabled={checkingQuota}
                  variant="outline"
                >
                  {checkingQuota ? '检查中...' : '检查配额'}
                </Button>
                <Button type="button" onClick={testAICall} variant="secondary">
                  测试 AI 调用
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>

      {/* 配额信息展示 - 仅在 free 模式下显示 */}
      {configMode === 'free' && renderQuotaCard()}
    </div>
  )
}

export default Setting
