import React from 'react'
import { ConfigModeSelector } from './components/config-mode-selector'
import { CustomConfigForm } from './components/custom-config-form'
import { QuotaCard } from './components/quota-card'
import { Title } from '@/components'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'

const Setting: React.FC = () => {
  const [selectorMode, setSelectorMode] = React.useState<'custom' | 'free'>('custom')

  const { petEnabled, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      petEnabled: state.petEnabled !== false,
      setGlobalData: state.setGlobalData,
    })),
  )

  return (
    <div className="space-y-8">
      <Title title="AI 相关配置" />
      <ConfigModeSelector configMode={selectorMode} onModeChange={setSelectorMode} />
      {selectorMode === 'custom' && <CustomConfigForm />}
      {selectorMode === 'free' && <QuotaCard />}

      <Title title="桌面宠物" />
      <div className="flex items-center gap-3">
        <Switch
          id="pet-enabled"
          checked={petEnabled}
          onCheckedChange={(checked) => {
            setGlobalData({ petEnabled: checked })
          }}
        />
        <Label htmlFor="pet-enabled" className="cursor-pointer text-sm font-medium">
          在 B 站页面显示桌面宠物
        </Label>
      </div>
      {petEnabled && (
        <p className="text-xs text-muted-foreground ml-12">
          小电视会在 B 站页面右下角出现，根据你的操作变换表情，连续整理还能解锁新皮肤哦~
        </p>
      )}
    </div>
  )
}

export default Setting
