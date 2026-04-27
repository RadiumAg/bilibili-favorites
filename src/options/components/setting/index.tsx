import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { ConfigModeSelector } from './components/config-mode-selector'
import { CustomConfigForm } from './components/custom-config-form'
import { QuotaCard } from './components/quota-card'

const Setting: React.FC = () => {
  const { configMode, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      configMode: state.aiConfig.configMode || 'free',
      setGlobalData: state.setGlobalData,
    })),
  )

  const [selectorMode, setSelectorMode] = React.useState<'custom' | 'free'>('custom')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Switch
          id="free-mode"
          checked={configMode === 'free'}
          onCheckedChange={(checked) => {
            const newMode = checked ? 'free' : 'custom'
            setGlobalData({ aiConfig: { configMode: newMode } })
          }}
        />
        <Label htmlFor="free-mode" className="cursor-pointer text-sm font-medium">
          使用内置免费 AI
        </Label>
      </div>

      <ConfigModeSelector configMode={selectorMode} onModeChange={setSelectorMode} />

      {selectorMode === 'custom' && <CustomConfigForm />}
      {selectorMode === 'free' && <QuotaCard />}
    </div>
  )
}

export default Setting
