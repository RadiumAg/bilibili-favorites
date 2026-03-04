import React from 'react'
import { Form } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useGlobalConfig } from '@/store/global-data'
import { toast } from '@/hooks/use-toast'
import { useShallow } from 'zustand/react/shallow'
import { useMount } from 'ahooks'
import { ConfigModeSelector } from './components/config-mode-selector'
import { CustomConfigForm } from './components/custom-config-form'
import { QuotaCard } from './components/quota-card'
import { FreeQuotaPanel } from './components/free-quota-panel'
import { defaultExtraParams, Adapter } from './util'
import type { ConfigMode, QuotaInfo, formSchema as formSchemaType } from './types'

const Setting: React.FC = () => {
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [quotaInfo, setQuotaInfo] = React.useState<QuotaInfo | null>(null)
  const [checkingQuota, setCheckingQuota] = React.useState(false)
  const [lastCheckTime, setLastCheckTime] = React.useState<string>('')
  const [configMode, setConfigMode] = React.useState<ConfigMode>('custom')

  const globalData = useGlobalConfig(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      setGlobalData: state.setGlobalData,
    })),
  )

  const form = useForm<z.infer<typeof formSchemaType>>({
    defaultValues: {
      key: globalData.aiConfig.key || '',
      baseUrl: globalData.aiConfig.baseUrl || '',
      model: globalData.aiConfig.model || '',
      extraParams: globalData.aiConfig.extraParams
        ? JSON.stringify(globalData.aiConfig.extraParams)
        : '',
      adapter: globalData.aiConfig.adapter || 'spark',
      aigateUserId: globalData.aiConfig.aigateUserId || '',
      aigateApiKeyId: globalData.aiConfig.aigateApiKeyId || '',
      configMode: globalData.aiConfig.configMode || 'custom',
    },
  })

  const handleSubmit = (data: z.infer<typeof formSchemaType>) => {
    console.log('[DEBUG] submit data', data)
    try {
      globalData.setGlobalData({
        aiConfig: {
          key: data.key,
          model: data.model,
          baseUrl: data.baseUrl,
          extraParams: data.extraParams ? JSON.parse(data.extraParams) : {},
          adapter: data.adapter as Adapter,
          aigateUserId: data.aigateUserId,
          aigateApiKeyId: data.aigateApiKeyId,
          configMode: data.configMode as ConfigMode,
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

  const checkQuota = async () => {
    setCheckingQuota(true)
    try {
      const port = chrome.runtime.connect({ name: 'ai-stream' })

      port.postMessage({
        type: 'checkAIGateQuota',
      })

      port.onMessage.addListener((response) => {
        if (response.type === 'quota-result') {
          const { quotaInfo: newQuotaInfo, message } = response.data
          setQuotaInfo(newQuotaInfo)
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
      }, 10000)
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

  const handleQuotaCheckResult = (result: QuotaInfo | null) => {
    setQuotaInfo(result)
    setLastCheckTime(new Date().toLocaleString())
    setCheckingQuota(false)
  }

  React.useEffect(() => {
    if (globalData.aiConfig.adapter == null) return
    const currentExtraParams = form.getValues('extraParams')
    const defaultParams = defaultExtraParams[globalData.aiConfig.adapter]
    if (!currentExtraParams || currentExtraParams.trim() === '') {
      form.setValue('extraParams', JSON.stringify(defaultParams))
    }
  }, [form, globalData.aiConfig.adapter])

  useMount(() => {
    checkQuota()
  })

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-[60%]">
          <ConfigModeSelector configMode={configMode} onModeChange={setConfigMode} />

          {configMode === 'custom' && (
            <CustomConfigForm
              form={form}
              showApiKey={showApiKey}
              onToggleApiKeyVisibility={() => setShowApiKey(!showApiKey)}
            />
          )}

          {configMode === 'free' && (
            <FreeQuotaPanel checkingQuota={checkingQuota} onCheckQuota={handleQuotaCheckResult} />
          )}
        </form>
      </Form>

      {configMode === 'free' && quotaInfo && <QuotaCard quotaInfo={quotaInfo} lastCheckTime={lastCheckTime} />}
    </div>
  )
}

export default Setting
