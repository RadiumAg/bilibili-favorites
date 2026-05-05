import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import type { PersonalityResult } from './use-personality-analysis'
import { MbtiAvatar } from './mbti-avatar'

type PersonalityResultViewProps = {
  result: PersonalityResult
  onReset: () => void
}

/** MBTI 维度配置 */
const DIMENSIONS = [
  { key: 'EI' as const, left: 'E 外向', right: 'I 内向', color: 'bg-pink-500' },
  { key: 'SN' as const, left: 'S 感觉', right: 'N 直觉', color: 'bg-blue-500' },
  { key: 'TF' as const, left: 'T 思考', right: 'F 情感', color: 'bg-amber-500' },
  { key: 'JP' as const, left: 'J 判断', right: 'P 感知', color: 'bg-emerald-500' },
]

export const PersonalityResultView: React.FC<PersonalityResultViewProps> = ({
  result,
  onReset,
}) => {
  return (
    <div className="space-y-6">
      {/* MBTI 类型大卡 */}
      <Card className="border-2 border-[#00A1D6]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <MbtiAvatar type={result.type} className="shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-[#00A1D6] tracking-wider">
                  {result.type}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#18191C]">{result.title}</h3>
              <p className="text-sm text-[#61666D] leading-relaxed">{result.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 四维度进度条 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">维度分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {DIMENSIONS.map(({ key, left, right, color }) => {
            const dim = result.dimensions[key]
            if (!dim) return null
            // score 偏向 tendency 方向：E/S/T/J 为左侧，I/N/F/P 为右侧
            const isLeftPole = ['E', 'S', 'T', 'J'].includes(dim.tendency)
            const progressValue = isLeftPole ? 100 - dim.score : dim.score

            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={isLeftPole ? 'font-semibold text-[#18191C]' : 'text-[#9499A0]'}>
                    {left}
                  </span>
                  <span className="text-[#9499A0] text-xs">{dim.reason}</span>
                  <span className={!isLeftPole ? 'font-semibold text-[#18191C]' : 'text-[#9499A0]'}>
                    {right}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={progressValue} className="h-3" indicatorClassName={color} />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-[#18191C] rounded-full"
                    style={{ left: `${progressValue}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 兴趣标签云 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            兴趣倾向
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.interests?.map((interest, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-sm px-3 py-1 bg-[#00A1D6]/10 text-[#00A1D6] hover:bg-[#00A1D6]/20"
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 个性化建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            个性化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.suggestions?.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#61666D]">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#00A1D6]/10 text-[#00A1D6] flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 重新分析按钮 */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          重新分析
        </Button>
      </div>
    </div>
  )
}
