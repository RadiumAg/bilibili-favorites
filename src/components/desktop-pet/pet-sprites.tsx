import React from 'react'
import type { PetMood } from './pet-config'
import { PIXEL_SCALE, SKIN_COLORS } from './pet-config'

/**
 * 像素角色 SVG 定义
 * 每个像素由 [x, y, color] 表示，绘制在 12x12 的网格上
 */

// 颜色常量
const C = {
  body: '#FFD93D',
  bodyDark: '#F0C418',
  eye: '#2D2D2D',
  eyeWhite: '#FFFFFF',
  blush: '#FF9999',
  mouth: '#2D2D2D',
  mouthHappy: '#E85D75',
  mouthAngry: '#CC3333',
  foot: '#E8A317',
  arm: '#F0C418',
  cap: '#1A1A2E',
  capTassel: '#FFD700',
  giftRed: '#FF4444',
  giftRibbon: '#FFD700',
  firework: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6'],
  bg: 'transparent',
} as const

type PixelData = [number, number, string][]

/** 根据皮肤等级替换基础颜色 */
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

// 基础像素数据（12x12 网格）
const BODY_PIXELS: PixelData = [
  [4, 0, C.body], [5, 0, C.body], [6, 0, C.body], [7, 0, C.body],
  [3, 1, C.body], [4, 1, C.body], [5, 1, C.body], [6, 1, C.body], [7, 1, C.body], [8, 1, C.body],
  [2, 2, C.body], [3, 2, C.body], [4, 2, C.body], [5, 2, C.body], [6, 2, C.body], [7, 2, C.body], [8, 2, C.body], [9, 2, C.body],
  [2, 3, C.body], [3, 3, C.body], [4, 3, C.body], [5, 3, C.body], [6, 3, C.body], [7, 3, C.body], [8, 3, C.body], [9, 3, C.body],
  [2, 4, C.body], [3, 4, C.body], [4, 4, C.eyeWhite], [5, 4, C.eye], [6, 4, C.body], [7, 4, C.eye], [8, 4, C.eyeWhite], [9, 4, C.body],
  [2, 5, C.body], [3, 5, C.blush], [4, 5, C.body], [5, 5, C.body], [6, 5, C.body], [7, 5, C.body], [8, 5, C.blush], [9, 5, C.body],
  [2, 6, C.body], [3, 6, C.body], [4, 6, C.body], [5, 6, C.mouth], [6, 6, C.mouth], [7, 6, C.body], [8, 6, C.body], [9, 6, C.body],
  [3, 7, C.body], [4, 7, C.body], [5, 7, C.body], [6, 7, C.body], [7, 7, C.body], [8, 7, C.body],
  [3, 8, C.body], [4, 8, C.bodyDark], [5, 8, C.bodyDark], [6, 8, C.bodyDark], [7, 8, C.bodyDark], [8, 8, C.body],
  [4, 9, C.bodyDark], [5, 9, C.bodyDark], [6, 9, C.bodyDark], [7, 9, C.bodyDark],
  [3, 10, C.foot], [4, 10, C.foot], [7, 10, C.foot], [8, 10, C.foot],
]

// happy 嘴巴
const HAPPY_MOUTH: PixelData = [
  [5, 6, C.mouthHappy], [6, 6, C.mouthHappy],
  [5, 7, C.mouthHappy], [6, 7, C.mouthHappy],
]

// sleep 闭眼
const SLEEP_EYES: PixelData = [
  [4, 4, C.eye], [5, 4, C.body], [7, 4, C.body], [8, 4, C.eye],
  [4, 5, C.eye], [8, 5, C.eye],
]

// wave 手臂
const WAVE_ARM: PixelData = [
  [1, 3, C.arm], [1, 2, C.arm], [1, 1, C.arm],
]

// walk 脚
const WALK_FEET_A: PixelData = [
  [3, 10, C.foot], [4, 10, C.foot], [7, 10, C.foot], [8, 10, C.foot],
  [2, 11, C.foot], [8, 11, C.foot],
]

// angry 怒眼 + 撇嘴
const ANGRY_EYES: PixelData = [
  [4, 3, C.eye], [5, 4, C.eye], [7, 4, C.eye], [8, 3, C.eye],
  [3, 5, '#FF6666'], [8, 5, '#FF6666'],
]
const ANGRY_MOUTH: PixelData = [
  [5, 6, C.mouthAngry], [6, 6, C.mouthAngry],
  [4, 7, C.mouthAngry], [7, 7, C.mouthAngry],
]

// dancing 双手举起 + 开心嘴
const DANCING_ARMS: PixelData = [
  [1, 2, C.arm], [1, 1, C.arm],
  [10, 2, C.arm], [10, 1, C.arm],
]

// gift 双手前伸接礼物
const GIFT_HANDS: PixelData = [
  [1, 5, C.arm], [1, 6, C.arm],
  [10, 5, C.arm], [10, 6, C.arm],
]

// gift 礼物盒像素
const GIFT_BOX: PixelData = [
  [5, 8, C.giftRed], [6, 8, C.giftRed],
  [4, 9, C.giftRed], [5, 9, C.giftRibbon], [6, 9, C.giftRibbon], [7, 9, C.giftRed],
  [4, 10, C.giftRed], [5, 10, C.giftRed], [6, 10, C.giftRed], [7, 10, C.giftRed],
]

// smart 博士帽
const GRADUATION_CAP: PixelData = [
  [3, -2, C.cap], [4, -2, C.cap], [5, -2, C.cap], [6, -2, C.cap], [7, -2, C.cap], [8, -2, C.cap],
  [4, -1, C.cap], [5, -1, C.cap], [6, -1, C.cap], [7, -1, C.cap],
  [8, -2, C.capTassel], [9, -1, C.capTassel], [9, 0, C.capTassel],
]

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

const svgWidth = 12 * PIXEL_SCALE
const svgHeight = 12 * PIXEL_SCALE

interface PetSpriteProps {
  mood: PetMood
  skinLevel?: number
}

/** 渲染指定心情的像素角色 SVG */
export const PetSprite: React.FC<PetSpriteProps> = (props) => {
  const { mood, skinLevel = 0 } = props
  let pixels: PixelData
  let extraHeight = 0

  switch (mood) {
    case 'happy':
      pixels = mergePixels(BODY_PIXELS, HAPPY_MOUTH)
      break
    case 'sleep':
      pixels = mergePixels(BODY_PIXELS, SLEEP_EYES)
      break
    case 'wave':
      pixels = mergePixels(BODY_PIXELS, WAVE_ARM)
      break
    case 'walk':
      pixels = mergePixels(BODY_PIXELS, WALK_FEET_A)
      break
    case 'angry':
      pixels = mergePixels(BODY_PIXELS, ANGRY_EYES, ANGRY_MOUTH)
      break
    case 'dancing':
      pixels = mergePixels(BODY_PIXELS, HAPPY_MOUTH, DANCING_ARMS)
      break
    case 'gift':
      pixels = mergePixels(BODY_PIXELS, HAPPY_MOUTH, GIFT_HANDS, GIFT_BOX)
      break
    case 'smart':
      extraHeight = 2
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

  const totalHeight = (12 + extraHeight) * PIXEL_SCALE

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
