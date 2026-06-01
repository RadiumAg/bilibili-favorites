import React from 'react'
import { PetSprite, HappyStars, SleepZzz } from './pet-sprites'
import { PetBubble } from './pet-bubble'
import { usePetState } from './use-pet-state'
import { usePetDrag } from './use-pet-drag'
import { PetMoodEngine } from './pet-mood-engine'
import './pet.css'

/**
 * B 站页面桌宠组件
 * - 浮动在页面右下角
 * - 可拖拽移动
 * - 根据用户行为改变心情和动画
 */
const DesktopPetInner: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { mood, dialogue, setMood } = usePetState()
  const { position, isDragging } = usePetDrag(containerRef)

  // 初始化状态感知引擎
  React.useEffect(() => {
    const engine = new PetMoodEngine(setMood)
    engine.start()
    return () => engine.stop()
  }, [setMood])

  // 点击桌宠 → happy
  const handleClick = React.useCallback(() => {
    if (!isDragging) {
      setMood('happy')
    }
  }, [isDragging, setMood])

  const moodClass = `bili-pet-mood-${mood}`

  return (
    <div
      ref={containerRef}
      className={`bili-pet-container ${moodClass} ${isDragging ? 'bili-pet-dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
      onClick={handleClick}
    >
      {/* 对话气泡 */}
      <PetBubble text={dialogue} />

      {/* 角色容器 */}
      <div className="relative bili-pet-body">
        {/* happy 状态星星 */}
        {mood === 'happy' && <HappyStars />}

        {/* sleep 状态 Z 字符 */}
        {mood === 'sleep' && <SleepZzz />}

        {/* 像素角色 */}
        <PetSprite mood={mood} />
      </div>
    </div>
  )
}

/** 桌宠入口组件（带错误边界） */
const DesktopPet: React.FC = () => {
  return <DesktopPetInner />
}

export { DesktopPet }
