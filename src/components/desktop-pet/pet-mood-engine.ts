import type { PetMood } from './pet-config'
import { IDLE_THRESHOLD } from './pet-config'

type MoodCallback = (mood: PetMood) => void

/**
 * 桌宠状态感知引擎
 * 监听页面事件，推断用户行为并触发对应心情
 */
export class PetMoodEngine {
  private setMood: MoodCallback
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private lastActivityTime = Date.now()
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null
  private observer: MutationObserver | null = null
  private boundHandlers: Array<[string, EventListener]> = []

  constructor(setMood: MoodCallback) {
    this.setMood = setMood
  }

  /** 启动监听 */
  start() {
    // 页面加载 → wave
    this.setMood('wave')

    // 监听用户活动（用于空闲检测）
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll']
    for (const event of activityEvents) {
      const handler = () => this.onActivity()
      window.addEventListener(event, handler, { passive: true })
      this.boundHandlers.push([event, handler])
    }

    // 监听滚动 → walk
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.boundHandlers.push(['scroll', this.onScroll as EventListener])

    // 监听收藏按钮变化 → happy
    this.startFavoriteObserver()

    // 启动空闲检测
    this.startIdleCheck()

    // 监听来自后台的消息（收藏操作）
    this.listenForMessages()
  }

  /** 停止监听 */
  stop() {
    for (const [event, handler] of this.boundHandlers) {
      window.removeEventListener(event, handler)
    }
    this.boundHandlers = []

    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
      this.scrollTimeout = null
    }
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  private onActivity() {
    this.lastActivityTime = Date.now()
    this.resetIdleTimer()
  }

  private onScroll = () => {
    this.onActivity()
    // 防抖：滚动时只触发一次 walk
    if (!this.scrollTimeout) {
      this.setMood('walk')
      this.scrollTimeout = setTimeout(() => {
        this.scrollTimeout = null
      }, 2000)
    }
  }

  private startFavoriteObserver() {
    // MutationObserver 监听收藏按钮状态变化
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement
        // 检查是否是收藏相关的元素变化
        if (
          target.classList?.contains('bili-mini-fav') ||
          target.closest?.('.bili-mini-fav') ||
          target.classList?.contains('fav-btn') ||
          target.closest?.('.fav-btn') ||
          target.classList?.contains('collect-btn') ||
          target.closest?.('.video-tool .collect')
        ) {
          this.setMood('happy')
          return
        }
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-stat'],
    })
  }

  private startIdleCheck() {
    this.resetIdleTimer()
  }

  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    this.idleTimer = setTimeout(() => {
      this.setMood('sleep')
    }, IDLE_THRESHOLD)
  }

  /** 监听来自后台/其他脚本的消息 */
  private listenForMessages() {
    // 监听 chrome.runtime 消息（来自 popup 或 background 的收藏操作通知）
    try {
      chrome?.runtime?.onMessage?.addListener((message: any) => {
        if (message?.type === 'favorite_added' || message?.type === 'move_success') {
          this.setMood('happy')
        }
      })
    } catch {
      // 非扩展环境，忽略
    }
  }

  /** 手动触发 happy（供外部调用，如点击桌宠时） */
  triggerHappy() {
    this.setMood('happy')
  }

  /** 手动触发 idle（供外部调用） */
  triggerIdle() {
    this.setMood('idle')
  }
}
