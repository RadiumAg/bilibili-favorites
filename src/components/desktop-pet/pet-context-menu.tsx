import React from 'react'

interface PetContextMenuProps {
  visible: boolean
  position: { x: number; y: number }
  onClose: () => void
}

const MENU_ITEMS = [
  { id: 'organize', label: '🔑 关键字整理' },
  { id: 'ai-organize', label: '🤖 AI 整理' },
  { id: 'analysis', label: '📊 数据分析' },
  { id: 'settings', label: '⚙️ 设置' },
] as const

function executeAction() {
  chrome?.runtime?.sendMessage({ type: 'open_sidepanel' })
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
            executeAction()
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
