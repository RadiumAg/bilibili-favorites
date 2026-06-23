import React from 'react'
import { useMemoizedFn } from 'ahooks'
import type { PetMood } from './pet-config'
import { MOOD_PRIORITY, MOOD_DURATION, PET_DIALOGUES } from './pet-config'

const STORAGE_KEY = 'bili-pet-mood'

export type SetMoodOptions = {
  force?: boolean
  dialogue?: string
}

/** 随机选择对话文案 */
function randomDialogue(mood: PetMood): string {
  const lines = PET_DIALOGUES[mood]
  return lines[Math.floor(Math.random() * lines.length)] ?? ''
}

function normalizeSetMoodOptions(
  forceOrOptions?: boolean | SetMoodOptions,
): SetMoodOptions {
  if (typeof forceOrOptions === 'boolean') {
    return { force: forceOrOptions }
  }
  return forceOrOptions ?? {}
}

/**
 * 管理桌宠心情状态
 * - 支持优先级切换（高优先级心情可以打断低优先级）
 * - 自动定时回落到 idle
 * - 持久化到 chrome.storage.local
 */
export function usePetState() {
  const [mood, setMoodState] = React.useState<PetMood>('idle')
  const [dialogue, setDialogue] = React.useState('')
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // 初始化时从 storage 恢复
  React.useEffect(() => {
    try {
      chrome?.storage?.local?.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          setMoodState(result[STORAGE_KEY])
        } else {
          // 首次加载，打招呼
          setMoodState('wave')
          setDialogue(randomDialogue('wave'))
        }
      })
    } catch {
      setMoodState('wave')
      setDialogue(randomDialogue('wave'))
    }
  }, [])

  const setMood = useMemoizedFn((newMood: PetMood, forceOrOptions?: boolean | SetMoodOptions) => {
    const { force = false, dialogue: customDialogue } = normalizeSetMoodOptions(forceOrOptions)

    setMoodState((current) => {
      const currentPriority = MOOD_PRIORITY[current]
      const newPriority = MOOD_PRIORITY[newMood]

      if (!force && newPriority < currentPriority) {
        return current
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      setDialogue(customDialogue ?? randomDialogue(newMood))

      try {
        chrome?.storage?.local?.set({ [STORAGE_KEY]: newMood })
      } catch {
        // ignore
      }

      const duration = MOOD_DURATION[newMood]
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setMoodState('idle')
          setDialogue('')
          try {
            chrome?.storage?.local?.set({ [STORAGE_KEY]: 'idle' })
          } catch {
            // ignore
          }
        }, duration)
      }

      return newMood
    })
  })

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { mood, dialogue, setMood }
}
