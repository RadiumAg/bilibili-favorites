import React from 'react'
import { openOrganizePage, openAnalysisPage } from './pet-actions'

interface PetContextMenuProps {
  visible: boolean
  position: { x: number; y: number }
  onClose: () => void
}

const MENU_ITEMS = [
  { id: 'organize', label: '🔑 标签整理', tab: 'keyword-manager' },
  { id: 'ai-organize', label: '🤖 AI 整理', tab: 'keyword-manager' },
  { id: 'analysis', label: '📊 数据分析', tab: 'analysis' },
  { id: 'settings', label: '⚙️ 设置', tab: 'setting' },
] as const

function executeAction(tab: string) {
  if (tab === 'keyword-manager') {
    openOrganizePage()
    return
  }
  if (tab === 'analysis') {
    openAnalysisPage()
    return
  }
  window.open(chrome.runtime.getURL(`options.html?tab=${tab}`), '_blank')
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
            executeAction(item.tab)
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
