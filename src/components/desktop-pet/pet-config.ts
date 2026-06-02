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

/** 连续整理天数达标 */
export const STREAK_GOAL = 3

/** 桌宠成长数据存储 key */
export const PET_GROWTH_KEY = 'bili-pet-growth'

/** 成长数据结构 */
export interface PetGrowthData {
  lastOpenTime: number
  consecutiveOrganizeDays: number
  lastOrganizeDate: string
  skinLevel: number
  totalOrganizeCount: number
}

/** 默认成长数据 */
export const DEFAULT_GROWTH: PetGrowthData = {
  lastOpenTime: Date.now(),
  consecutiveOrganizeDays: 0,
  lastOrganizeDate: '',
  skinLevel: 0,
  totalOrganizeCount: 0,
}

/** 对话气泡文案 */
export const PET_DIALOGUES: Record<PetMood, string[]> = {
  happy: ['收藏成功！', '这个视频不错~', '又多了个收藏！', '好东西！'],
  idle: ['你在吗？', '好无聊啊...', '要不要整理下收藏夹？'],
  wave: ['你好呀！', '欢迎回来~', '今天想整理收藏夹吗？'],
  walk: ['散步中~', '让我逛逛...', '看看有什么好视频~'],
  sleep: ['zzZ...', 'zzZ...', ''],
  sit: ['看分析中...', '数据好多呀', '认真分析中~'],
  angry: ['好乱啊！快整理一下！', '堆积了好多视频...', '该整理了！😤', '再不整理我要生气了！'],
  dancing: ['整理完成！太棒了~🎉', '收藏夹干净啦！', '好开心！跳个舞~', '完美！继续保持！'],
  gift: ['哇！新收藏！🎁', '接住了！', '又有好东西了~', '收到礼物啦！'],
  smart: ['分析完成！🧠', '数据洞察已生成~', '让我看看结果...', '博士帽戴好了！'],
}

/** 像素尺寸 */
export const PET_SIZE = 48
export const PIXEL_SCALE = 3

/** 皮肤配色方案（随 skinLevel 解锁） */
export const SKIN_COLORS = [
  { body: '#FFD93D', bodyDark: '#F0C418', foot: '#E8A317' },
  { body: '#FF9ECD', bodyDark: '#E87FB3', foot: '#D06A9C' },
  { body: '#87CEEB', bodyDark: '#6BB5D6', foot: '#5A9EC0' },
  { body: '#98FB98', bodyDark: '#7FE07F', foot: '#6BC56B' },
  { body: '#DDA0DD', bodyDark: '#C88DC8', foot: '#B07AB0' },
] as const
