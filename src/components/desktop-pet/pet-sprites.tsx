import React from 'react'
import type { PetMood } from './pet-config'
import { PIXEL_SCALE, SKIN_COLORS } from './pet-config'

/*
 * B站小电视像素角色 — 14x14 网格
 *
 *   天线:       row 0~1
 *   外壳顶边:   row 2
 *   屏幕区域:   row 3~8  (col 2~11 外壳, col 3~10 屏幕)
 *   外壳底边:   row 9
 *   底座/脚:    row 10~11
 */

const C = {
  shell: '#E8E8E8',
  shellDark: '#C0C0C0',
  screen: '#00A1D6',
  screenDark: '#0082AE',
  screenOff: '#333333',
  eye: '#FFFFFF',
  eyePupil: '#2D2D2D',
  mouth: '#FFFFFF',
  mouthHappy: '#FFE66D',
  mouthAngry: '#FF4444',
  blush: '#FF9999',
  antenna: '#888888',
  antennaTip: '#FF6B6B',
  foot: '#A0A0A0',
  cap: '#1A1A2E',
  capTassel: '#FFD700',
  giftRed: '#FF4444',
  giftRibbon: '#FFD700',
  angryScreen: '#FF3333',
  firework: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6'],
} as const

type PixelData = [number, number, string][]

function applySkin(pixels: PixelData, skinLevel: number): PixelData {
  const skin = SKIN_COLORS[skinLevel % SKIN_COLORS.length]
  if (!skin) return pixels
  const defaultSkin = SKIN_COLORS[0]
  return pixels.map(([x, y, color]) => {
    if (color === defaultSkin.body) return [x, y, skin.body]
    if (color === defaultSkin.bodyDark) return [x, y, skin.bodyDark]
    if (color === defaultSkin.foot) return [x, y, skin.foot]
    return [x, y, color]
  })
}

// ── 天线 ──
const ANTENNA: PixelData = [
  [4, 0, C.antennaTip], [9, 0, C.antennaTip],
  [5, 1, C.antenna],    [8, 1, C.antenna],
]

// ── 外壳 + 屏幕（基础：正常眼睛 + 小嘴） ──
const TV_SHELL: PixelData = [
  // 顶边
  [3, 2, C.shell], [4, 2, C.shell], [5, 2, C.shell], [6, 2, C.shell], [7, 2, C.shell], [8, 2, C.shell], [9, 2, C.shell], [10, 2, C.shell],
  // 左右壳 + 屏幕 row3
  [2, 3, C.shell], [3, 3, C.screen], [4, 3, C.screen], [5, 3, C.screen], [6, 3, C.screen], [7, 3, C.screen], [8, 3, C.screen], [9, 3, C.screen], [10, 3, C.screen], [11, 3, C.shell],
  // row4 — 屏幕（眼睛）
  [2, 4, C.shell], [3, 4, C.screen], [4, 4, C.eye], [5, 4, C.eyePupil], [6, 4, C.screen], [7, 4, C.screen], [8, 4, C.eyePupil], [9, 4, C.eye], [10, 4, C.screen], [11, 4, C.shell],
  // row5 — 屏幕（腮红）
  [2, 5, C.shell], [3, 5, C.blush], [4, 5, C.screen], [5, 5, C.screen], [6, 5, C.screen], [7, 5, C.screen], [8, 5, C.screen], [9, 5, C.screen], [10, 5, C.blush], [11, 5, C.shell],
  // row6 — 屏幕（嘴巴）
  [2, 6, C.shell], [3, 6, C.screen], [4, 6, C.screen], [5, 6, C.screen], [6, 6, C.mouth], [7, 6, C.mouth], [8, 6, C.screen], [9, 6, C.screen], [10, 6, C.screen], [11, 6, C.shell],
  // row7 — 屏幕下半
  [2, 7, C.shell], [3, 7, C.screen], [4, 7, C.screen], [5, 7, C.screen], [6, 7, C.screen], [7, 7, C.screen], [8, 7, C.screen], [9, 7, C.screen], [10, 7, C.screen], [11, 7, C.shell],
  // row8 — 屏幕底
  [2, 8, C.shell], [3, 8, C.screenDark], [4, 8, C.screenDark], [5, 8, C.screenDark], [6, 8, C.screenDark], [7, 8, C.screenDark], [8, 8, C.screenDark], [9, 8, C.screenDark], [10, 8, C.screenDark], [11, 8, C.shell],
  // 底边
  [3, 9, C.shellDark], [4, 9, C.shellDark], [5, 9, C.shellDark], [6, 9, C.shellDark], [7, 9, C.shellDark], [8, 9, C.shellDark], [9, 9, C.shellDark], [10, 9, C.shellDark],
  // 底座/脚
  [4, 10, C.foot], [5, 10, C.foot], [8, 10, C.foot], [9, 10, C.foot],
  [3, 11, C.foot], [5, 11, C.foot], [8, 11, C.foot], [10, 11, C.foot],
]

const BODY_PIXELS: PixelData = [...ANTENNA, ...TV_SHELL]

// ── 表情变体 ──

const HAPPY_FACE: PixelData = [
  // 弯弯眼（开心眯眼）
  [4, 4, C.eye], [5, 4, C.screen], [8, 4, C.screen], [9, 4, C.eye],
  [4, 5, C.screen], [5, 5, C.eye], [8, 5, C.eye], [9, 5, C.screen],
  // 大笑嘴
  [5, 6, C.mouthHappy], [6, 6, C.mouthHappy], [7, 6, C.mouthHappy], [8, 6, C.mouthHappy],
  [6, 7, C.mouthHappy], [7, 7, C.mouthHappy],
]

const SLEEP_FACE: PixelData = [
  // 屏幕变暗
  [3, 3, C.screenOff], [4, 3, C.screenOff], [5, 3, C.screenOff], [6, 3, C.screenOff], [7, 3, C.screenOff], [8, 3, C.screenOff], [9, 3, C.screenOff], [10, 3, C.screenOff],
  [3, 4, C.screenOff], [4, 4, C.screenOff], [5, 4, C.screenOff], [6, 4, C.screenOff], [7, 4, C.screenOff], [8, 4, C.screenOff], [9, 4, C.screenOff], [10, 4, C.screenOff],
  [3, 5, C.screenOff], [4, 5, C.screenOff], [5, 5, C.screenOff], [6, 5, C.screenOff], [7, 5, C.screenOff], [8, 5, C.screenOff], [9, 5, C.screenOff], [10, 5, C.screenOff],
  [3, 6, C.screenOff], [4, 6, C.screenOff], [5, 6, C.screenOff], [6, 6, C.screenOff], [7, 6, C.screenOff], [8, 6, C.screenOff], [9, 6, C.screenOff], [10, 6, C.screenOff],
  [3, 7, C.screenOff], [4, 7, C.screenOff], [5, 7, C.screenOff], [6, 7, C.screenOff], [7, 7, C.screenOff], [8, 7, C.screenOff], [9, 7, C.screenOff], [10, 7, C.screenOff],
  [3, 8, C.screenOff], [4, 8, C.screenOff], [5, 8, C.screenOff], [6, 8, C.screenOff], [7, 8, C.screenOff], [8, 8, C.screenOff], [9, 8, C.screenOff], [10, 8, C.screenOff],
]

const WAVE_ANTENNA: PixelData = [
  // 左天线不动，右天线弯曲
  [4, 0, C.antennaTip], [10, 0, C.antennaTip],
  [5, 1, C.antenna],    [9, 0, C.antenna],
]

const WALK_FEET: PixelData = [
  [4, 10, C.foot], [5, 10, C.foot], [8, 10, C.foot], [9, 10, C.foot],
  [3, 11, C.foot], [10, 11, C.foot],
]

const ANGRY_FACE: PixelData = [
  // 屏幕变红色调
  [3, 3, C.angryScreen], [4, 3, C.angryScreen], [5, 3, C.angryScreen], [6, 3, C.angryScreen], [7, 3, C.angryScreen], [8, 3, C.angryScreen], [9, 3, C.angryScreen], [10, 3, C.angryScreen],
  // 怒视眼（V 形眉毛 + 眼睛）
  [4, 4, C.eyePupil], [5, 4, C.eye], [6, 4, C.angryScreen], [7, 4, C.angryScreen], [8, 4, C.eye], [9, 4, C.eyePupil],
  [3, 5, C.angryScreen], [4, 5, C.angryScreen], [5, 5, C.angryScreen], [6, 5, C.angryScreen], [7, 5, C.angryScreen], [8, 5, C.angryScreen], [9, 5, C.angryScreen], [10, 5, C.angryScreen],
  // 锯齿嘴
  [5, 6, C.mouthAngry], [6, 6, C.angryScreen], [7, 6, C.mouthAngry], [8, 6, C.angryScreen],
  [5, 7, C.angryScreen], [6, 7, C.mouthAngry], [7, 7, C.angryScreen], [8, 7, C.mouthAngry],
  [3, 8, C.angryScreen], [4, 8, C.angryScreen], [5, 8, C.angryScreen], [6, 8, C.angryScreen], [7, 8, C.angryScreen], [8, 8, C.angryScreen], [9, 8, C.angryScreen], [10, 8, C.angryScreen],
]

const GIFT_BOX: PixelData = [
  [6, 9, C.giftRibbon], [7, 9, C.giftRibbon],
  [5, 10, C.giftRed], [6, 10, C.giftRibbon], [7, 10, C.giftRibbon], [8, 10, C.giftRed],
  [5, 11, C.giftRed], [6, 11, C.giftRed], [7, 11, C.giftRed], [8, 11, C.giftRed],
]

const GRADUATION_CAP: PixelData = [
  [2, -1, C.cap], [3, -1, C.cap], [4, -1, C.cap], [5, -1, C.cap], [6, -1, C.cap], [7, -1, C.cap], [8, -1, C.cap], [9, -1, C.cap], [10, -1, C.cap], [11, -1, C.cap],
  [4, 0, C.cap], [5, 0, C.cap], [6, 0, C.cap], [7, 0, C.cap], [8, 0, C.cap], [9, 0, C.cap],
  [10, -1, C.capTassel], [11, 0, C.capTassel], [11, 1, C.capTassel],
]

// ── 渲染工具 ──

function renderPixels(pixels: PixelData, scale: number = PIXEL_SCALE, offsetY = 0) {
  return pixels.map(([x, y, color], i) => (
    <rect
      key={i}
      x={x * scale}
      y={(y + offsetY) * scale}
      width={scale}
      height={scale}
      fill={color}
    />
  ))
}

function mergePixels(...layers: PixelData[]): PixelData {
  const map = new Map<string, [number, number, string]>()
  for (const layer of layers) {
    for (const pixel of layer) {
      map.set(`${pixel[0]},${pixel[1]}`, pixel)
    }
  }
  return Array.from(map.values())
}

const GRID = 14
const svgWidth = GRID * PIXEL_SCALE
const svgHeight = GRID * PIXEL_SCALE

interface PetSpriteProps {
  mood: PetMood
  skinLevel?: number
}

export const PetSprite: React.FC<PetSpriteProps> = (props) => {
  const { mood, skinLevel = 0 } = props
  let pixels: PixelData
  let extraHeight = 0

  switch (mood) {
    case 'happy':
      pixels = mergePixels(BODY_PIXELS, HAPPY_FACE)
      break
    case 'sleep':
      pixels = mergePixels(BODY_PIXELS, SLEEP_FACE)
      break
    case 'wave':
      pixels = mergePixels(BODY_PIXELS, WAVE_ANTENNA)
      break
    case 'walk':
      pixels = mergePixels(BODY_PIXELS, WALK_FEET)
      break
    case 'angry':
      pixels = mergePixels(BODY_PIXELS, ANGRY_FACE)
      break
    case 'dancing':
      pixels = mergePixels(BODY_PIXELS, HAPPY_FACE)
      break
    case 'gift':
      pixels = mergePixels(BODY_PIXELS, HAPPY_FACE, GIFT_BOX)
      break
    case 'smart':
      extraHeight = 1
      pixels = mergePixels(BODY_PIXELS, GRADUATION_CAP)
      break
    case 'sit':
    case 'idle':
    default:
      pixels = mergePixels(BODY_PIXELS)
      break
  }

  if (skinLevel > 0) {
    pixels = applySkin(pixels, skinLevel)
  }

  const totalHeight = (GRID + extraHeight) * PIXEL_SCALE

  return (
    <svg
      className="bili-pet-sprite"
      width={svgWidth}
      height={totalHeight}
      viewBox={`0 0 ${svgWidth} ${totalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderPixels(pixels, PIXEL_SCALE, extraHeight)}
    </svg>
  )
}

/** 星星装饰（happy 状态） */
export const HappyStars: React.FC = () => (
  <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="absolute text-xs"
        style={{
          left: `${(i - 1) * 14}px`,
          animation: `bili-pet-star-pop 0.6s ease-out ${i * 0.15}s`,
          animationFillMode: 'forwards',
        }}
      >
        ✦
      </span>
    ))}
  </div>
)

/** Z 字符装饰（sleep 状态） */
export const SleepZzz: React.FC = () => (
  <div className="absolute -top-1 right-0 pointer-events-none">
    {['z', 'Z', 'Z'].map((z, i) => (
      <span
        key={i}
        className="absolute text-xs font-bold text-blue-400"
        style={{
          animation: `bili-pet-z-float 2s ease-out ${i * 0.7}s infinite`,
          animationFillMode: 'forwards',
        }}
      >
        {z}
      </span>
    ))}
  </div>
)

/** 烟花粒子装饰（dancing 整理完成状态） */
export const FireworkParticles: React.FC = () => (
  <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none">
    {C.firework.map((color, i) => (
      <span
        key={i}
        className="absolute rounded-full"
        style={{
          width: 4,
          height: 4,
          backgroundColor: color,
          left: `${(i - 2) * 10}px`,
          animation: `bili-pet-firework 1s ease-out ${i * 0.1}s`,
          animationFillMode: 'forwards',
        }}
      />
    ))}
  </div>
)

/** 怒气符号装饰（angry 状态） */
export const AngerMark: React.FC = () => (
  <div className="absolute -top-3 -right-1 pointer-events-none">
    <span
      className="text-red-500 text-sm font-bold"
      style={{
        animation: 'bili-pet-anger-pulse 0.5s ease-in-out infinite',
      }}
    >
      💢
    </span>
  </div>
)

/** 博士帽光效装饰（smart 状态） */
export const SmartGlow: React.FC = () => (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none">
    <span
      className="text-yellow-400 text-xs"
      style={{
        animation: 'bili-pet-glow 1.5s ease-in-out infinite',
      }}
    >
      ✨
    </span>
  </div>
)

/** 皮肤进化星星（streak 达成时） */
export const EvolveSpark: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className="absolute text-yellow-300 text-xs"
        style={{
          left: `${[0, 100, 30, 70][i]}%`,
          top: `${[20, 40, 80, 60][i]}%`,
          animation: `bili-pet-evolve-spark 1.2s ease-out ${i * 0.2}s`,
          animationFillMode: 'forwards',
        }}
      >
        ⭐
      </span>
    ))}
  </div>
)
