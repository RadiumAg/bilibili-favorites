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
      size="sm"
      onClick={handleClick}
      className="bg-b-primary hover:bg-b-primary-hover h-7 transition-colors duration-200"
    >
      自动创建关键字
    </Button>
  )
}

export default AutoCreateKeyword
