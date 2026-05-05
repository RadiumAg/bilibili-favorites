import React from 'react'

// 16personalities 官方头像 SVG（本地化）
import intjSvg from '@/assets/mbti/intj-architect-male.svg'
import intpSvg from '@/assets/mbti/intp-logician-female.svg'
import entjSvg from '@/assets/mbti/entj-commander-female.svg'
import entpSvg from '@/assets/mbti/entp-debater-male.svg'
import infjSvg from '@/assets/mbti/infj-advocate-male.svg'
import infpSvg from '@/assets/mbti/infp-mediator-female.svg'
import enfjSvg from '@/assets/mbti/enfj-protagonist-male.svg'
import enfpSvg from '@/assets/mbti/enfp-campaigner-female.svg'
import istjSvg from '@/assets/mbti/istj-logistician-male.svg'
import isfjSvg from '@/assets/mbti/isfj-defender-female.svg'
import estjSvg from '@/assets/mbti/estj-executive-female.svg'
import esfjSvg from '@/assets/mbti/esfj-consul-male.svg'
import istpSvg from '@/assets/mbti/istp-virtuoso-male.svg'
import isfpSvg from '@/assets/mbti/isfp-adventurer-female.svg'
import estpSvg from '@/assets/mbti/estp-entrepreneur-male.svg'
import esfpSvg from '@/assets/mbti/esfp-entertainer-female.svg'

type MbtiAvatarProps = {
  type: string
  className?: string
}

/** 16personalities 类型 → 本地头像 SVG 映射 */
const TYPE_SVG_MAP: Record<string, string> = {
  INTJ: intjSvg,
  INTP: intpSvg,
  ENTJ: entjSvg,
  ENTP: entpSvg,
  INFJ: infjSvg,
  INFP: infpSvg,
  ENFJ: enfjSvg,
  ENFP: enfpSvg,
  ISTJ: istjSvg,
  ISFJ: isfjSvg,
  ESTJ: estjSvg,
  ESFJ: esfjSvg,
  ISTP: istpSvg,
  ISFP: isfpSvg,
  ESTP: estpSvg,
  ESFP: esfpSvg,
}

/** MBTI 四大气质组配色（用于背景色） */
const GROUP_BG: Record<string, string> = {
  analyst: '#9333EA', // 紫色 - 分析师
  diplomat: '#059669', // 绿色 - 外交家
  sentinel: '#2563EB', // 蓝色 - 守护者
  explorer: '#D97706', // 橙色 - 探险家
}

const getGroup = (type: string): string => {
  const second = type[1]
  const third = type[2]
  if (second === 'N' && third === 'T') return 'analyst'
  if (second === 'N' && third === 'F') return 'diplomat'
  if (second === 'S' && third === 'T') return 'sentinel'
  if (second === 'S' && third === 'F') return 'explorer'
  return 'analyst'
}

/** MBTI 卡通头像 - 使用本地化 16personalities SVG */
export const MbtiAvatar: React.FC<MbtiAvatarProps> = ({ type, className }) => {
  const svgSrc = TYPE_SVG_MAP[type.toUpperCase()] || intjSvg
  const group = getGroup(type)
  const bgColor = GROUP_BG[group]

  return (
    <div
      className={className}
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bgColor}15, ${bgColor}30)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: `2px solid ${bgColor}40`,
      }}
    >
      <img
        src={svgSrc}
        alt={`${type} personality`}
        aria-label={`${type.toUpperCase()}的头像`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: 8,
        }}
        draggable={false}
      />
    </div>
  )
}
