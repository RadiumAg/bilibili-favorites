import React from 'react'
import { Form } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useGlobalConfig } from '@/store/global-data'
import { toast } from '@/hooks/use-toast'
import { useShallow } from 'zustand/react/shallow'
import { ConfigModeSelector } from './components/config-mode-selector'
import { CustomConfigForm } from './components/custom-config-form'
import { QuotaCard } from './components/quota-card'
import { defaultExtraParams, Adapter } from './util'
import type { ConfigMode, QuotaInfo, formSchema as formSchemaType } from './types'

const Setting: React.FC = () => {
  const [showApiKey, setShowApiKey] = React.useState(false)
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

  React.useEffect(() => {
    if (globalData.aiConfig.adapter == null) return
    const currentExtraParams = form.getValues('extraParams')
    const defaultParams = defaultExtraParams[globalData.aiConfig.adapter]
    if (!currentExtraParams || currentExtraParams.trim() === '') {
      form.setValue('extraParams', JSON.stringify(defaultParams))
    }
  }, [form, globalData.aiConfig.adapter])

  return (
    <div className="space-y-8">
      <ConfigModeSelector configMode={configMode} onModeChange={setConfigMode} />

      <Form {...form}>
        <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-full md:w-[60%]">
          {configMode === 'custom' && (
            <CustomConfigForm
              form={form}
              showApiKey={showApiKey}
              onToggleApiKeyVisibility={() => setShowApiKey(!showApiKey)}
            />
          )}
        </form>
      </Form>

      {configMode === 'free' && <QuotaCard />}
    </div>
  )
}

export default Setting
