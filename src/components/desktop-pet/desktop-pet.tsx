import React from 'react'
import {
  PetSprite,
  HappyStars,
  SleepZzz,
  FireworkParticles,
  AngerMark,
  SmartGlow,
  EvolveSpark,
} from './pet-sprites'
import { PetBubble } from './pet-bubble'
import { usePetState } from './use-pet-state'
import { usePetDrag } from './use-pet-drag'
import { PetMoodEngine } from './pet-mood-engine'
import type { PetGrowthData } from './pet-config'
import { DEFAULT_GROWTH } from './pet-config'
import './pet.css'

/**
 * B 站页面桌宠组件
 * - 浮动在页面右下角，可拖拽移动
 * - 根据用户行为改变心情和动画
 * - 支持成长系统（连续整理解锁皮肤）
 */
const DesktopPetInner: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { mood, dialogue, setMood } = usePetState()
  const { position, isDragging } = usePetDrag(containerRef)
  const [growth, setGrowth] = React.useState<PetGrowthData>({ ...DEFAULT_GROWTH })
  const [showEvolveSpark, setShowEvolveSpark] = React.useState(false)
  const engineRef = React.useRef<PetMoodEngine | null>(null)
  const prevSkinLevelRef = React.useRef(0)

  const handleGrowthChange = React.useCallback((newGrowth: PetGrowthData) => {
    setGrowth((prev) => {
      if (newGrowth.skinLevel > prev.skinLevel) {
        setShowEvolveSpark(true)
        setTimeout(() => setShowEvolveSpark(false), 1500)
      }
      return newGrowth
    })
  }, [])

  React.useEffect(() => {
    const engine = new PetMoodEngine(setMood, handleGrowthChange)
    engineRef.current = engine
    engine.start()
    prevSkinLevelRef.current = engine.getGrowth().skinLevel
    setGrowth(engine.getGrowth())
    return () => engine.stop()
  }, [setMood, handleGrowthChange])

  const handleClick = React.useCallback(() => {
    if (isDragging) return
    // sleep 状态下点击 → 唤醒
    if (mood === 'sleep') {
      engineRef.current?.triggerWakeUp()
    } else {
      setMood('happy')
    }
  }, [isDragging, mood, setMood])

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
      <PetBubble text={dialogue} />

      <div className="relative bili-pet-body">
        {mood === 'happy' && <HappyStars />}
        {mood === 'sleep' && <SleepZzz />}
        {mood === 'angry' && <AngerMark />}
        {mood === 'dancing' && <FireworkParticles />}
        {mood === 'smart' && <SmartGlow />}
        {showEvolveSpark && <EvolveSpark />}

        <PetSprite mood={mood} skinLevel={growth.skinLevel} />
      </div>
    </div>
  )
}

const DesktopPet: React.FC = () => {
  return <DesktopPetInner />
}

export { DesktopPet }
