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
      className="bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6"
    >
      自动创建关键字
    </Button>
  )
}

export default AutoCreateKeyword
