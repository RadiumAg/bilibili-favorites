import React from 'react'
import { ConfigModeSelector } from './components/config-mode-selector'
import { CustomConfigForm } from './components/custom-config-form'
import { QuotaCard } from './components/quota-card'

const Setting: React.FC = () => {
  const [selectorMode, setSelectorMode] = React.useState<'custom' | 'free'>('custom')

  return (
    <div className="space-y-8">
      <ConfigModeSelector configMode={selectorMode} onModeChange={setSelectorMode} />

      {selectorMode === 'custom' && <CustomConfigForm />}
      {selectorMode === 'free' && <QuotaCard />}
    </div>
  )
}

export default Setting
