import React from 'react'

type MbtiAvatarProps = {
  type: string
  className?: string
}

/** MBTI 四大气质组配色 */
const GROUP_COLORS = {
  analyst: { bg: '#9333EA', body: '#7C3AED', accent: '#C084FC', label: '分析师' },
  diplomat: { bg: '#059669', body: '#047857', accent: '#6EE7B7', label: '外交家' },
  sentinel: { bg: '#2563EB', body: '#1D4ED8', accent: '#93C5FD', label: '守护者' },
  explorer: { bg: '#D97706', body: '#B45309', accent: '#FCD34D', label: '探险家' },
} as const

type GroupKey = keyof typeof GROUP_COLORS

/** 根据 MBTI 类型判断气质组 */
const getGroup = (type: string): GroupKey => {
  const second = type[1]
  const third = type[2]
  if (second === 'N' && third === 'T') return 'analyst'
  if (second === 'N' && third === 'F') return 'diplomat'
  if (second === 'S' && third === 'T') return 'sentinel'
  if (second === 'S' && third === 'F') return 'explorer'
  return 'analyst'
}

/** 根据 MBTI 类型获取装饰物 SVG */
const Accessory = ({ type, color }: { type: string; color: string }) => {
  const g = getGroup(type)
  const isE = type[0] === 'E'
  const isJ = type[3] === 'J'

  switch (g) {
    case 'analyst':
      // 眼镜 (INTJ/INTP) 或皇冠 (ENTJ/ENTP)
      return isE ? (
        <g>
          {/* 小皇冠 */}
          <path
            d="M62 22 L68 14 L74 20 L80 12 L86 22"
            fill="#FCD34D"
            stroke="#B45309"
            strokeWidth="1"
          />
          <rect
            x="62"
            y="22"
            width="24"
            height="4"
            rx="1"
            fill="#FCD34D"
            stroke="#B45309"
            strokeWidth="0.5"
          />
          <circle cx="68" cy="12" r="1.5" fill="#EF4444" />
          <circle cx="80" cy="10" r="1.5" fill="#3B82F6" />
          <circle cx="74" cy="18" r="1" fill="#10B981" />
        </g>
      ) : (
        <g>
          {/* 眼镜 */}
          <circle cx="56" cy="52" r="10" fill="none" stroke="#374151" strokeWidth="2" />
          <circle cx="92" cy="52" r="10" fill="none" stroke="#374151" strokeWidth="2" />
          <line x1="66" y1="52" x2="82" y2="52" stroke="#374151" strokeWidth="2" />
          <line x1="46" y1="52" x2="38" y2="48" stroke="#374151" strokeWidth="1.5" />
          <line x1="102" y1="52" x2="110" y2="48" stroke="#374151" strokeWidth="1.5" />
        </g>
      )

    case 'diplomat':
      // 花朵 (INFP/INFJ) 或 星星 (ENFP/ENFJ)
      return isE ? (
        <g>
          {/* 闪光星星 */}
          <path
            d="M108 28 L111 36 L120 36 L113 42 L115 50 L108 45 L101 50 L103 42 L96 36 L105 36 Z"
            fill={color}
            stroke="#F59E0B"
            strokeWidth="0.8"
          />
          <path
            d="M30 32 L32 37 L37 37 L33 40 L34 45 L30 42 L26 45 L27 40 L23 37 L28 37 Z"
            fill="#FCD34D"
            stroke="#F59E0B"
            strokeWidth="0.5"
            transform="scale(0.7)"
          />
        </g>
      ) : (
        <g>
          {/* 花朵 */}
          <circle cx="108" cy="30" r="5" fill="#F472B6" />
          <circle cx="103" cy="25" r="4" fill="#FB923C" />
          <circle cx="113" cy="25" r="4" fill="#A78BFA" />
          <circle cx="103" cy="35" r="4" fill="#34D399" />
          <circle cx="113" cy="35" r="4" fill="#60A5FA" />
          <circle cx="108" cy="30" r="3" fill="#FBBF24" />
          <line x1="108" y1="35" x2="108" y2="50" stroke="#059669" strokeWidth="1.5" />
        </g>
      )

    case 'sentinel':
      // 盾牌 (ISTJ/ISFJ) 或 勋章 (ESTJ/ESFJ)
      return isE ? (
        <g>
          {/* 勋章 */}
          <circle cx="108" cy="26" r="10" fill="#FCD34D" stroke="#B45309" strokeWidth="1" />
          <circle cx="108" cy="26" r="6" fill="#F59E0B" />
          <text x="108" y="29" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400E">
            1
          </text>
          <path d="M104 36 L108 44 L112 36" fill="#FCD34D" stroke="#B45309" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          {/* 盾牌 */}
          <path
            d="M100 18 L108 14 L116 18 L116 28 L108 34 L100 28 Z"
            fill="#93C5FD"
            stroke="#1D4ED8"
            strokeWidth="1.5"
          />
          <path d="M104 20 L108 17 L112 20 L112 26 L108 30 L104 26 Z" fill="#3B82F6" />
          <polyline
            points="104,24 107,27 113,21"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )

    case 'explorer':
      // 调色盘 (ISFP/ISTP) 或 闪电 (ESFP/ESTP)
      return isE ? (
        <g>
          {/* 闪电 */}
          <path
            d="M110 16 L104 30 L110 30 L106 44 L118 26 L112 26 L116 16 Z"
            fill="#FCD34D"
            stroke="#B45309"
            strokeWidth="1"
          />
        </g>
      ) : (
        <g>
          {/* 调色盘 */}
          <ellipse
            cx="108"
            cy="30"
            rx="12"
            ry="10"
            fill="#F5F5F4"
            stroke="#78716C"
            strokeWidth="1"
          />
          <circle cx="104" cy="26" r="2.5" fill="#EF4444" />
          <circle cx="110" cy="24" r="2.5" fill="#3B82F6" />
          <circle cx="114" cy="28" r="2.5" fill="#FCD34D" />
          <circle cx="106" cy="33" r="2.5" fill="#10B981" />
          <ellipse
            cx="112"
            cy="34"
            rx="3"
            ry="2.5"
            fill="#F5F5F4"
            stroke="#78716C"
            strokeWidth="0.5"
          />
        </g>
      )
  }
}

/** 表情：外向(E)微笑露齿，内向(I)温和微笑 */
const Face = ({ type }: { type: string }) => {
  const isE = type[0] === 'E'
  const isT = type[2] === 'T'

  return (
    <g>
      {/* 眼睛 */}
      {isE ? (
        // E 型：大眼活泼
        <>
          <ellipse cx="56" cy="52" rx="5" ry="5.5" fill="#1F2937" />
          <ellipse cx="92" cy="52" rx="5" ry="5.5" fill="#1F2937" />
          <circle cx="58" cy="50" r="2" fill="white" />
          <circle cx="94" cy="50" r="2" fill="white" />
        </>
      ) : (
        // I 型：柔和内敛
        <>
          <ellipse cx="56" cy="53" rx="3.5" ry="4" fill="#1F2937" />
          <ellipse cx="92" cy="53" rx="3.5" ry="4" fill="#1F2937" />
          <circle cx="57.5" cy="51.5" r="1.2" fill="white" />
          <circle cx="93.5" cy="51.5" r="1.2" fill="white" />
        </>
      )}
      {/* 腮红 */}
      <ellipse cx="44" cy="60" rx="6" ry="3.5" fill="#F9A8D4" opacity="0.5" />
      <ellipse cx="104" cy="60" rx="6" ry="3.5" fill="#F9A8D4" opacity="0.5" />
      {/* 嘴巴 */}
      {isE ? (
        <path
          d="M64 64 Q74 74 84 64"
          fill="none"
          stroke="#1F2937"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M67 65 Q74 71 81 65"
          fill="none"
          stroke="#1F2937"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
      {/* T 型：挑眉 */}
      {isT && (
        <>
          <line
            x1="50"
            y1="44"
            x2="62"
            y2="42"
            stroke="#1F2937"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="86"
            y1="42"
            x2="98"
            y2="44"
            stroke="#1F2937"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  )
}

/** 发型：J 型整齐，P 型随性 */
const Hair = ({ type, color }: { type: string; color: string }) => {
  const isJ = type[3] === 'J'
  const isE = type[0] === 'E'

  if (isJ) {
    // J 型：整齐的发型
    return (
      <g>
        <path
          d="M42 46 Q42 24 74 20 Q106 24 106 46 L106 38 Q106 28 74 24 Q42 28 42 38 Z"
          fill={color}
        />
        <path d="M42 38 Q42 32 74 28 Q106 32 106 38" fill={color} opacity="0.8" />
      </g>
    )
  }

  // P 型：蓬松随性
  return (
    <g>
      <path
        d="M38 48 Q36 28 74 18 Q112 28 110 48 L108 38 Q106 26 74 22 Q42 26 40 38 Z"
        fill={color}
      />
      {/* 蓬松的碎发 */}
      <path d="M44 34 Q40 26 48 22 Q44 18 54 20" fill={color} opacity="0.9" />
      <path d="M104 34 Q108 26 100 22 Q104 18 94 20" fill={color} opacity="0.9" />
      {isE && (
        <>
          <path d="M50 28 Q46 16 56 18" fill={color} opacity="0.85" />
          <path d="M90 26 Q94 16 86 18" fill={color} opacity="0.85" />
        </>
      )}
    </g>
  )
}

/** 主组件：MBTI 卡通头像 */
export const MbtiAvatar: React.FC<MbtiAvatarProps> = ({ type, className }) => {
  const group = getGroup(type)
  const colors = GROUP_COLORS[group]
  const isE = type[0] === 'E'

  return (
    <div className={className}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 148 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景圆 */}
        <circle cx="74" cy="60" r="56" fill={colors.bg} opacity="0.1" />
        <circle cx="74" cy="60" r="50" fill={colors.bg} opacity="0.15" />

        {/* 身体 */}
        <ellipse cx="74" cy="106" rx="28" ry="16" fill={colors.body} />
        <rect x="46" y="92" width="56" height="14" rx="7" fill={colors.body} />

        {/* 衣领装饰 */}
        <path d="M62 92 L74 100 L86 92" fill={colors.accent} opacity="0.6" />

        {/* 头部 */}
        <circle cx="74" cy="56" r="30" fill="#FDE68A" />

        {/* 头发 */}
        <Hair type={type} color={colors.body} />

        {/* 面部表情 */}
        <Face type={type} />

        {/* 类型专属装饰 */}
        <Accessory type={type} color={colors.accent} />

        {/* 外向型：张手 */}
        {isE && (
          <g>
            <path
              d="M44 88 Q32 82 28 74"
              stroke={colors.body}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="26" cy="72" r="3" fill="#FDE68A" />
            <path
              d="M104 88 Q116 82 120 74"
              stroke={colors.body}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="122" cy="72" r="3" fill="#FDE68A" />
          </g>
        )}

        {/* 内向型：安静的手 */}
        {!isE && (
          <g>
            <ellipse cx="48" cy="96" rx="5" ry="6" fill="#FDE68A" />
            <ellipse cx="100" cy="96" rx="5" ry="6" fill="#FDE68A" />
          </g>
        )}
      </svg>
    </div>
  )
}
