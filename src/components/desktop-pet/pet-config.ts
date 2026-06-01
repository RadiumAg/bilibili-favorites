/** 桌宠心情状态 */
export type PetMood = 'wave' | 'idle' | 'walk' | 'happy' | 'sleep' | 'sit'

/** 桌宠事件 */
export type PetEvent =
  | { type: 'page_load' }
  | { type: 'scroll' }
  | { type: 'favorite_detected' }
  | { type: 'idle_tick'; duration: number }
  | { type: 'click' }

/** 状态优先级（数字越大优先级越高） */
export const MOOD_PRIORITY: Record<PetMood, number> = {
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
}

/** 空闲多久进入 sleep（ms） */
export const IDLE_THRESHOLD = 5 * 60 * 1000

/** 对话气泡文案 */
export const PET_DIALOGUES: Record<PetMood, string[]> = {
  happy: ['收藏成功！', '这个视频不错~', '又多了个收藏！', '好东西！'],
  idle: ['你在吗？', '好无聊啊...', '要不要整理下收藏夹？'],
  wave: ['你好呀！', '欢迎回来~', '今天想整理收藏夹吗？'],
  walk: ['散步中~', '让我逛逛...', '看看有什么好视频~'],
  sleep: ['zzZ...', 'zzZ...', ''],
  sit: ['看分析中...', '数据好多呀', '认真分析中~'],
}

/** 像素尺寸 */
export const PET_SIZE = 48
export const PIXEL_SCALE = 3 // 每个像素块 3px
