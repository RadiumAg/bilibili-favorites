import React from 'react'
import { Button } from '@/components/ui/button'

type ConfigMode = 'custom' | 'free'

interface ConfigModeSelectorProps {
  configMode: ConfigMode
  onModeChange: (mode: ConfigMode) => void
}

export const ConfigModeSelector: React.FC<ConfigModeSelectorProps> = ({
  configMode,
  onModeChange,
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">AI 配置模式</h3>
      <div className="flex gap-4">
        <Button
          type="button"
          variant={configMode === 'custom' ? 'default' : 'outline'}
          onClick={() => onModeChange('custom')}
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
          onClick={() => onModeChange('free')}
          className="flex-1"
        >
          <div className="text-left">
            <div className="font-medium">免费额度</div>
            <div className="text-xs opacity-75">使用 AIGate 免费大模型</div>
          </div>
        </Button>
      </div>
    </div>
  )
}
