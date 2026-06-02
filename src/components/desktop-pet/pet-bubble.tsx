import React from 'react'

type PetBubbleProps = {
  text: string
}

/** 对话气泡组件 */
export const PetBubble: React.FC<PetBubbleProps> = ({ text }) => {
  if (!text) return null

  return (
    <div className="bili-pet-bubble">
      {text}
    </div>
  )
}
