import React from 'react'

type PetBubbleProps = {
  text: string
  action?: {
    label: string
    onClick: () => void
  }
}

/** 对话气泡组件 */
export const PetBubble: React.FC<PetBubbleProps> = ({ text, action }) => {
  if (!text && !action) return null

  return (
    <div className={`bili-pet-bubble ${action ? 'bili-pet-bubble-with-action' : ''}`}>
      {text ? <span className="bili-pet-bubble-text">{text}</span> : null}
      {action ? (
        <button
          type="button"
          className="bili-pet-bubble-action bili-pet-no-drag"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            action.onClick()
          }}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
