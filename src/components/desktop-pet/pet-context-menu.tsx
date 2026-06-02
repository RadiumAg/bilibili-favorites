import React from 'react'

interface PetContextMenuProps {
  visible: boolean
  position: { x: number; y: number }
  onClose: () => void
}

const MENU_ITEMS = [
  { id: 'organize', label: '🔑 关键字整理', action: 'open_popup' },
  { id: 'ai-organize', label: '🤖 AI 整理', action: 'open_popup_ai' },
  { id: 'analysis', label: '📊 数据分析', action: 'open_options_analysis' },
  { id: 'settings', label: '⚙️ 设置', action: 'open_options' },
] as const

type MenuAction = (typeof MENU_ITEMS)[number]['action']

function executeAction(action: MenuAction) {
  try {
    switch (action) {
      case 'open_popup':
        chrome?.runtime?.sendMessage({ type: 'open_popup' })
        break
      case 'open_popup_ai':
        chrome?.runtime?.sendMessage({ type: 'open_popup_ai' })
        break
      case 'open_options_analysis':
        chrome?.runtime?.openOptionsPage?.()
        break
      case 'open_options':
        chrome?.runtime?.openOptionsPage?.()
        break
    }
  } catch {
    // ignore
  }
}

const PetContextMenu: React.FC<PetContextMenuProps> = (props) => {
  const { visible, position, onClose } = props
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!visible) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="bili-pet-context-menu"
      style={{ left: position.x, top: position.y }}
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.id}
          className="bili-pet-menu-item"
          onClick={() => {
            executeAction(item.action)
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export { PetContextMenu }
