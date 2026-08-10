import { describe, expect, it } from 'vitest'
import { getAnalysisAgeText } from '../src/options/components/personality/analysis-age'

const DAY_MS = 24 * 60 * 60 * 1000

describe('personality analysis age text', () => {
  const now = new Date('2026-08-10T12:00:00+08:00').getTime()

  it.each([
    [0, '刚刚分析过'],
    [12, '已经12天啦'],
    [90, '已经3个月啦'],
    [360, '已经1年啦'],
    [420, '已经1年2个月啦'],
  ])('分析完成 %i 天后显示 %s', (days, expected) => {
    expect(getAnalysisAgeText(now - days * DAY_MS, now)).toBe(expected)
  })
})
