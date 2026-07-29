import { describe, expect, it } from 'vitest'
import { shouldRecordAIMoveUse } from '../src/popup/components/ai-move/star-invitation'

describe('AI move Star invitation eligibility', () => {
  it('有视频移动成功时记录一次使用', () => {
    expect(shouldRecordAIMoveUse(1, 0)).toBe(true)
  })

  it('AI 正常完成但所有视频无需移动时也记录一次使用', () => {
    expect(shouldRecordAIMoveUse(0, 2)).toBe(true)
  })

  it('没有有效结果或全部失败时不记录使用', () => {
    expect(shouldRecordAIMoveUse(0, 0)).toBe(false)
  })
})
