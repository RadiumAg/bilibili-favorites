import React from 'react'
import { Button } from '@/components/ui/button'

const AutoCreateKeyword: React.FC = () => {
  const handleClick = async () => {
    await chrome.tabs.create({
      url: 'options.html?tab=keyword-manager',
      active: true,
    })
  }

  return (
    <Button
      onClick={handleClick}
      className="bg-b-primary hover:bg-b-primary-hover p-1 h-8 transition-colors duration-200"
    >
      自动创建关键字
    </Button>
  )
}

export default AutoCreateKeyword
