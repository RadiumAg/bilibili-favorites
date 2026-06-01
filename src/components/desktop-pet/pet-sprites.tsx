import React from 'react'
import type { PetMood } from './pet-config'
import { PIXEL_SCALE } from './pet-config'

/**
 * 像素角色 SVG 定义
 * 每个像素由 [x, y, color] 表示，绘制在 12x12 的网格上
 */

// 颜色常量
const C = {
  body: '#FFD93D',      // 主体黄色
  bodyDark: '#F0C418',  // 主体暗面
  eye: '#2D2D2D',       // 眼睛黑色
  eyeWhite: '#FFFFFF',  // 眼睛高光
  blush: '#FF9999',     // 腮红
  mouth: '#2D2D2D',     // 嘴巴
  mouthHappy: '#E85D75', // 开心嘴巴
  foot: '#E8A317',      // 脚
  arm: '#F0C418',       // 手臂
  bg: 'transparent',
} as const

type PixelData = [number, number, string][]

// 基础像素数据（12x12 网格）
const BODY_PIXELS: PixelData = [
  // 头顶轮廓
  [4, 0, C.body], [5, 0, C.body], [6, 0, C.body], [7, 0, C.body],
  // 头部
  [3, 1, C.body], [4, 1, C.body], [5, 1, C.body], [6, 1, C.body], [7, 1, C.body], [8, 1, C.body],
  [2, 2, C.body], [3, 2, C.body], [4, 2, C.body], [5, 2, C.body], [6, 2, C.body], [7, 2, C.body], [8, 2, C.body], [9, 2, C.body],
  [2, 3, C.body], [3, 3, C.body], [4, 3, C.body], [5, 3, C.body], [6, 3, C.body], [7, 3, C.body], [8, 3, C.body], [9, 3, C.body],
  // 脸部（眼睛层）
  [2, 4, C.body], [3, 4, C.body], [4, 4, C.eyeWhite], [5, 4, C.eye], [6, 4, C.body], [7, 4, C.eye], [8, 4, C.eyeWhite], [9, 4, C.body],
  // 腮红层
  [2, 5, C.body], [3, 5, C.blush], [4, 5, C.body], [5, 5, C.body], [6, 5, C.body], [7, 5, C.body], [8, 5, C.blush], [9, 5, C.body],
  // 嘴巴层
  [2, 6, C.body], [3, 6, C.body], [4, 6, C.body], [5, 6, C.mouth], [6, 6, C.mouth], [7, 6, C.body], [8, 6, C.body], [9, 6, C.body],
  // 身体
  [3, 7, C.body], [4, 7, C.body], [5, 7, C.body], [6, 7, C.body], [7, 7, C.body], [8, 7, C.body],
  [3, 8, C.body], [4, 8, C.bodyDark], [5, 8, C.bodyDark], [6, 8, C.bodyDark], [7, 8, C.bodyDark], [8, 8, C.body],
  // 底部
  [4, 9, C.bodyDark], [5, 9, C.bodyDark], [6, 9, C.bodyDark], [7, 9, C.bodyDark],
  // 脚
  [3, 10, C.foot], [4, 10, C.foot], [7, 10, C.foot], [8, 10, C.foot],
]

// happy 嘴巴（张嘴笑）
const HAPPY_MOUTH: PixelData = [
  [5, 6, C.mouthHappy], [6, 6, C.mouthHappy],
  [5, 7, C.mouthHappy], [6, 7, C.mouthHappy],
]

// sleep 眼睛（闭眼）
const SLEEP_EYES: PixelData = [
  [4, 4, C.eye], [5, 4, C.body], [7, 4, C.body], [8, 4, C.eye],
  // 闭眼横线
  [4, 5, C.eye], [8, 5, C.eye],
]

// wave 手臂抬起
const WAVE_ARM: PixelData = [
  [1, 3, C.arm], [1, 2, C.arm], [1, 1, C.arm],
]

// 左移的脚（走路用）
const WALK_FEET_A: PixelData = [
  [3, 10, C.foot], [4, 10, C.foot], [7, 10, C.foot], [8, 10, C.foot],
  [2, 11, C.foot], [8, 11, C.foot],
]

const WALK_FEET_B: PixelData = [
  [3, 10, C.foot], [4, 10, C.foot], [7, 10, C.foot], [8, 10, C.foot],
  [4, 11, C.foot], [7, 11, C.foot],
]

function renderPixels(pixels: PixelData, scale: number = PIXEL_SCALE) {
  return pixels.map(([x, y, color], i) => (
    <rect
      key={i}
      x={x * scale}
      y={y * scale}
      width={scale}
      height={scale}
      fill={color}
    />
  ))
}

function mergePixels(...layers: PixelData[]): PixelData {
  // 后面的层覆盖前面的（用 Map 按 x,y 去重）
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

/** 渲染指定心情的像素角色 SVG */
export const PetSprite: React.FC<{ mood: PetMood }> = ({ mood }) => {
  let pixels: PixelData

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
      // walk 的动画由 CSS 处理，这里用基础图形
      pixels = mergePixels(BODY_PIXELS, WALK_FEET_A)
      break
    case 'sit':
      pixels = mergePixels(BODY_PIXELS)
      break
    case 'idle':
    default:
      pixels = mergePixels(BODY_PIXELS)
      break
  }

  return (
    <svg
      className="bili-pet-sprite"
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderPixels(pixels)}
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
