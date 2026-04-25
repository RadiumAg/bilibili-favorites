import React from 'react'

import { ConfigModeSelector } from './components/config-mode-selector'
import { CustomConfigForm } from './components/custom-config-form'
import { QuotaCard } from './components/quota-card'
import type { ConfigMode } from './types'

const Setting: React.FC = () => {
  const [configMode, setConfigMode] = React.useState<ConfigMode>('custom')

  return (
    <div className="space-y-8">
      <ConfigModeSelector configMode={configMode} onModeChange={setConfigMode} />
      {configMode === 'custom' && <CustomConfigForm />}
      {configMode === 'free' && <QuotaCard />}
    </div>
  )
}

export default Setting
