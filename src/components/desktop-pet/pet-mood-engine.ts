import type { PetMood, PetGrowthData } from './pet-config'
import {
  IDLE_THRESHOLD,
  ABSENCE_DAYS,
  PILE_UP_THRESHOLD,
  STREAK_GOAL,
  PET_GROWTH_KEY,
  DEFAULT_GROWTH,
} from './pet-config'

type MoodCallback = (mood: PetMood, force?: boolean) => void

/** 获取 chrome.storage.local 的 helper */
function getStorage<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    try {
      chrome?.storage?.local?.get([key], (result) => {
        resolve(result[key] ?? fallback)
      })
    } catch {
      resolve(fallback)
    }
  })
}

function setStorage(data: Record<string, unknown>): void {
  try {
    chrome?.storage?.local?.set(data)
  } catch {
    // ignore
  }
}

/** 获取当天日期字符串 YYYY-MM-DD */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

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
  private pileCheckTimer: ReturnType<typeof setInterval> | null = null
  private growth: PetGrowthData = { ...DEFAULT_GROWTH }
  private onGrowthChange: ((growth: PetGrowthData) => void) | null = null

  constructor(setMood: MoodCallback, onGrowthChange?: (growth: PetGrowthData) => void) {
    this.setMood = setMood
    this.onGrowthChange = onGrowthChange ?? null
  }

  /** 启动监听 */
  async start() {
    await this.loadGrowthData()

    // 检查长期未访问（7 天没打开）
    const absenceTriggered = this.checkLongAbsence()

    // 更新上次打开时间
    this.growth.lastOpenTime = Date.now()
    this.saveGrowthData()

    if (absenceTriggered) {
      this.setMood('sleep', true)
    } else {
      this.setMood('wave')
    }

    // 监听用户活动
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll']
    for (const event of activityEvents) {
      const handler = () => this.onActivity()
      window.addEventListener(event, handler, { passive: true })
      this.boundHandlers.push([event, handler])
    }

    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.boundHandlers.push(['scroll', this.onScroll as EventListener])

    this.startFavoriteObserver()
    this.startIdleCheck()
    this.listenForMessages()

    // 定期检查默认收藏夹堆积
    this.startPileUpCheck()
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
    if (this.pileCheckTimer) {
      clearInterval(this.pileCheckTimer)
      this.pileCheckTimer = null
    }
  }

  /** 加载成长数据 */
  private async loadGrowthData() {
    this.growth = await getStorage<PetGrowthData>(PET_GROWTH_KEY, { ...DEFAULT_GROWTH })
  }

  /** 保存成长数据 */
  private saveGrowthData() {
    setStorage({ [PET_GROWTH_KEY]: this.growth })
    this.onGrowthChange?.(this.growth)
  }

  /** 检查是否 7 天没打开（返回 true 表示触发了长期未访问） */
  private checkLongAbsence(): boolean {
    if (!this.growth.lastOpenTime) return false
    const daysSinceLastOpen = (Date.now() - this.growth.lastOpenTime) / (1000 * 60 * 60 * 24)
    return daysSinceLastOpen >= ABSENCE_DAYS
  }

  /** 定期检查默认收藏夹是否堆积 > 100 */
  private startPileUpCheck() {
    const check = () => {
      try {
        chrome?.runtime?.sendMessage({ type: 'get_default_fav_count' }, (response: any) => {
          if (response?.count !== undefined && response.count > PILE_UP_THRESHOLD) {
            this.setMood('angry')
          }
        })
      } catch {
        // ignore
      }
    }
    // 启动后延迟 5 秒首次检查，之后每 5 分钟检查一次
    setTimeout(check, 5000)
    this.pileCheckTimer = setInterval(check, 5 * 60 * 1000)
  }

  private onActivity() {
    this.lastActivityTime = Date.now()
    this.resetIdleTimer()
  }

  private onScroll = () => {
    this.onActivity()
    if (!this.scrollTimeout) {
      this.setMood('walk')
      this.scrollTimeout = setTimeout(() => {
        this.scrollTimeout = null
      }, 2000)
    }
  }

  private startFavoriteObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement
        if (
          target.classList?.contains('bili-mini-fav') ||
          target.closest?.('.bili-mini-fav') ||
          target.classList?.contains('fav-btn') ||
          target.closest?.('.fav-btn') ||
          target.classList?.contains('collect-btn') ||
          target.closest?.('.video-tool .collect')
        ) {
          this.setMood('gift')
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
    try {
      chrome?.runtime?.onMessage?.addListener((message: any) => {
        switch (message?.type) {
          case 'favorite_added':
            this.setMood('gift')
            break
          case 'move_success':
          case 'organize_done':
            this.handleOrganizeDone()
            break
          case 'ai_analysis_done':
            this.setMood('smart', true)
            break
        }
      })
    } catch {
      // 非扩展环境
    }
  }

  /** 处理整理完成事件 */
  private handleOrganizeDone() {
    this.setMood('dancing', true)

    const today = todayStr()
    if (this.growth.lastOrganizeDate === today) return

    // 检查是否连续整理
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (this.growth.lastOrganizeDate === yesterday) {
      this.growth.consecutiveOrganizeDays += 1
    } else {
      this.growth.consecutiveOrganizeDays = 1
    }

    this.growth.lastOrganizeDate = today
    this.growth.totalOrganizeCount += 1

    // 连续 3 天达成 → 皮肤进化
    if (this.growth.consecutiveOrganizeDays >= STREAK_GOAL) {
      this.growth.skinLevel = Math.min(this.growth.skinLevel + 1, 4)
      this.growth.consecutiveOrganizeDays = 0
    }

    this.saveGrowthData()
  }

  /** 手动触发心情（供外部调用） */
  triggerMood(mood: PetMood) {
    this.setMood(mood)
  }

  /** 手动唤醒（sleep → wave，用于 7 天未打开后点击唤醒） */
  triggerWakeUp() {
    this.setMood('wave', true)
  }

  /** 获取当前成长数据 */
  getGrowth(): PetGrowthData {
    return { ...this.growth }
  }
}
