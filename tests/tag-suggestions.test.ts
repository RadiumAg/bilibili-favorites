import { describe, expect, it } from 'vitest'
import { createTagSuggestionGroups } from '../src/utils/tag-suggestions'

describe('createTagSuggestionGroups', () => {
  it('仅为至少三个视频的目标收藏夹生成 3 到 5 个去重候选词', () => {
    const groups = createTagSuggestionGroups([
      {
        favoriteId: 2,
        favoriteTitle: '前端开发',
        titles: ['React Hooks 入门指南', 'React Hooks 实战案例', 'React Hooks 最佳实践'],
        existingTags: ['React'],
      },
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].candidates.length).toBeGreaterThanOrEqual(3)
    expect(groups[0].candidates.length).toBeLessThanOrEqual(5)
    expect(groups[0].candidates.map((item) => item.toLowerCase())).not.toContain('react')
  })

  it('样本不足三个视频时不生成建议', () => {
    const groups = createTagSuggestionGroups([
      {
        favoriteId: 3,
        favoriteTitle: '音乐',
        titles: ['爵士乐现场', '古典音乐会'],
        existingTags: [],
      },
    ])

    expect(groups).toEqual([])
  })
})
