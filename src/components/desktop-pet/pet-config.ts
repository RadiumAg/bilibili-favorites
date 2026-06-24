/** 桌宠心情状态 */
export type PetMood =
  | 'wave' | 'idle' | 'walk' | 'happy' | 'sleep' | 'sit'
  | 'angry' | 'dancing' | 'gift' | 'smart'

/** 桌宠事件 */
export type PetEvent =
  | { type: 'page_load' }
  | { type: 'scroll' }
  | { type: 'favorite_detected' }
  | { type: 'idle_tick'; duration: number }
  | { type: 'click' }
  | { type: 'favorites_piled_up' }
  | { type: 'organize_done' }
  | { type: 'long_absence' }
  | { type: 'streak_achieved' }
  | { type: 'new_favorite' }
  | { type: 'ai_analysis_done'; summary?: string }

/** 状态优先级（数字越大优先级越高） */
export const MOOD_PRIORITY: Record<PetMood, number> = {
  angry: 7,
  dancing: 6,
  smart: 6,
  gift: 5,
  happy: 5,
  sleep: 4,
  wave: 3,
  walk: 2,
  sit: 1,
  idle: 0,
}

/** 各状态持续时间（ms），0 表示由事件驱动自动退出 */
export const MOOD_DURATION: Record<PetMood, number> = {
  wave: 3000,
  idle: 0,
  walk: 1500,
  happy: 2500,
  sleep: 0,
  sit: 0,
  angry: 5000,
  dancing: 4000,
  gift: 3000,
  smart: 5000,
}

/** 空闲多久进入 sleep（ms） */
export const IDLE_THRESHOLD = 5 * 60 * 1000

/** 多少天没打开算"长期未访问" */
export const ABSENCE_DAYS = 7

/** 默认收藏夹堆积阈值 */
export const PILE_UP_THRESHOLD = 100

/** 桌宠成长数据存储 key */
export const PET_GROWTH_KEY = 'bili-pet-growth'

/** 成长数据结构 */
export interface PetGrowthData {
  lastOpenTime: number
  consecutiveOrganizeDays: number
  lastOrganizeDate: string
  /** 当前穿戴的皮肤等级 */
  activeSkinLevel: number
  totalOrganizeCount: number
}

/** 默认成长数据 */
export const DEFAULT_GROWTH: PetGrowthData = {
  lastOpenTime: Date.now(),
  consecutiveOrganizeDays: 0,
  lastOrganizeDate: '',
  activeSkinLevel: 0,
  totalOrganizeCount: 0,
}

/** 皮肤名称 */
export const SKIN_NAMES = ['银灰', '樱粉', '天蓝', '薄荷', '星紫'] as const

/** 规范化成长数据（兼容旧版本存储） */
export function normalizeGrowthData(data: Partial<PetGrowthData> & { skinLevel?: number }): PetGrowthData {
  const maxSkin = SKIN_NAMES.length - 1
  const activeSkinLevel = Math.min(
    Math.max(0, data.activeSkinLevel ?? data.skinLevel ?? 0),
    maxSkin,
  )

  return {
    ...DEFAULT_GROWTH,
    ...data,
    activeSkinLevel,
  }
}

/** 收藏成功时的固定气泡文案 */
export const FAVORITE_ADDED_DIALOGUE = '又多了个收藏！'

/** 对话气泡文案 */
export const PET_DIALOGUES: Record<PetMood, string[]> = {
  happy: ['收藏成功！📺', '好片子！已收录~', '又多了个收藏！', '信号满格！', '换台成功~'],
  idle: ['待机中...', '调频调频~', '要不要整理下收藏夹？'],
  wave: ['嗨！欢迎收看~', '开机成功！📺', '今天想整理收藏夹吗？'],
  walk: ['换台中~', '频道切换...', '扫描好视频中~'],
  sleep: ['zzZ...', '已关机...', ''],
  sit: ['播报分析中...', '数据频道~', '认真读取中~'],
  angry: ['信号过载！快整理！📺💢', '频道太多了...', '存储快满了！😤', '再不整理要死机了！'],
  dancing: ['整理完成！📺🎉', '频道清爽啦！', '开心到天线转圈~', '完美！继续保持！'],
  gift: ['收到新频道！🎁', '天线接收成功！', '又有好节目了~', '新信号已接收！'],
  smart: ['分析播报完成！🧠', '数据频道已生成~', '智能模式启动...', '博士频道上线！'],
}

/** 像素尺寸 */
export const PET_SIZE = 48
export const PIXEL_SCALE = 3

/** 皮肤配色方案 — 小电视外壳配色（点击循环切换）
 *  body = shell 主色, bodyDark = shellDark, foot = 底座
 */
export const SKIN_COLORS = [
  { body: '#E8E8E8', bodyDark: '#C0C0C0', foot: '#A0A0A0' },
  { body: '#FFB6C1', bodyDark: '#E8969E', foot: '#D07880' },
  { body: '#87CEEB', bodyDark: '#6BB5D6', foot: '#5A9EC0' },
  { body: '#C8F7C5', bodyDark: '#A3D9A0', foot: '#85BB82' },
  { body: '#E8D5F5', bodyDark: '#C8B0D9', foot: '#A890BC' },
] as const
