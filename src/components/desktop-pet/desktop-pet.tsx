import React from 'react'
import { useMemoizedFn } from 'ahooks'
import {
  PetSprite,
  HappyStars,
  SleepZzz,
  FireworkParticles,
  AngerMark,
  SmartGlow,
} from './pet-sprites'
import { PetBubble } from './pet-bubble'
import { PetContextMenu } from './pet-context-menu'
import { PetDashboard } from './pet-dashboard'
import { openOrganizePage } from './pet-actions'
import { usePetState } from './use-pet-state'
import { usePetDrag } from './use-pet-drag'
import { PetMoodEngine } from './pet-mood-engine'
import type { PetGrowthData } from './pet-config'
import { DEFAULT_GROWTH } from './pet-config'
import './pet.css'

const DesktopPetInner: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { mood, dialogue, setMood } = usePetState()
  const { position, isDragging } = usePetDrag(containerRef)
  const [growth, setGrowth] = React.useState<PetGrowthData>({ ...DEFAULT_GROWTH })
  const [isHovered, setIsHovered] = React.useState(false)
  const [contextMenu, setContextMenu] = React.useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  })
  const engineRef = React.useRef<PetMoodEngine | null>(null)
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGrowthChange = useMemoizedFn((newGrowth: PetGrowthData) => {
    setGrowth(newGrowth)
  })

  React.useEffect(() => {
    const engine = new PetMoodEngine(setMood, handleGrowthChange)
    engineRef.current = engine
    engine.start()
    setGrowth(engine.getGrowth())
    return () => engine.stop()
  }, [setMood, handleGrowthChange])

  const handleClick = useMemoizedFn(() => {
    if (isDragging) return
    if (mood === 'sleep') {
      engineRef.current?.triggerWakeUp()
      return
    }

    engineRef.current?.cycleSkin()
    setMood('happy')
  })

  const handleContextMenu = useMemoizedFn((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY })
    setIsHovered(false)
  })

  const handleCloseMenu = useMemoizedFn(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  })

  const handleMouseEnter = useMemoizedFn(() => {
    if (contextMenu.visible) return
    hoverTimerRef.current = setTimeout(() => setIsHovered(true), 500)
  })

  const handleMouseLeave = useMemoizedFn(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setIsHovered(false)
  })

  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const moodClass = `bili-pet-mood-${mood}`

  return (
    <>
      <div
        ref={containerRef}
        className={`bili-pet-container ${moodClass} ${isDragging ? 'bili-pet-dragging' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          pointerEvents: 'auto',
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative bili-pet-body">
          {isHovered && !contextMenu.visible && (
            <PetDashboard visible={isHovered} growth={growth} />
          )}

          {!isHovered && (
            <PetBubble
              text={dialogue}
              action={
                mood === 'angry'
                  ? {
                      label: '去整理',
                      onClick: openOrganizePage,
                    }
                  : undefined
              }
            />
          )}

          {mood === 'gift' && <HappyStars />}
          {mood === 'happy' && <HappyStars />}
          {mood === 'sleep' && <SleepZzz />}
          {mood === 'angry' && <AngerMark />}
          {mood === 'dancing' && <FireworkParticles />}
          {mood === 'smart' && <SmartGlow />}

          <PetSprite mood={mood} skinLevel={growth.activeSkinLevel} />
        </div>
      </div>

      <PetContextMenu
        visible={contextMenu.visible}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={handleCloseMenu}
      />
    </>
  )
}

const DesktopPet: React.FC = () => {
  return <DesktopPetInner />
}

export { DesktopPet }
