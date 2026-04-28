import React from 'react'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const CustomModeSwitch = () => {
  const { configMode, setGlobalData, getGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      getGlobalData: state.getGlobalData,
      configMode: state.aiConfig.configMode || 'free',
      setGlobalData: state.setGlobalData,
    })),
  )

  return (
    <div className="flex items-center gap-2 mb-4">
      <Switch
        id="free-mode"
        checked={configMode === 'free'}
        onCheckedChange={(checked) => {
          const newMode = checked ? 'free' : 'custom'
          const globalData = getGlobalData()
          setGlobalData({ aiConfig: { ...globalData.aiConfig, configMode: newMode } })
        }}
      />
      <Label htmlFor="free-mode" className="cursor-pointer text-sm font-medium">
        使用内置免费 AI
      </Label>
    </div>
  )
}

export default CustomModeSwitch
