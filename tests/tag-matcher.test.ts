import { describe, expect, it } from 'vitest'
import { matchVideosByTags } from '../src/utils/tag-matcher'

const favorites = [
  { id: 1, title: '默认收藏夹' },
  { id: 2, title: '前端' },
  { id: 3, title: '后端' },
]

const keywords = [
  { favoriteDataId: 1, value: [{ value: '稍后看' }] },
  { favoriteDataId: 2, value: [{ value: 'React' }, { value: 'TypeScript' }] },
  { favoriteDataId: 3, value: [{ value: 'Python' }, { value: 'TypeScript' }] },
]

describe('matchVideosByTags', () => {
  it('唯一命中时直接返回目标收藏夹与命中标签', () => {
    const result = matchVideosByTags(
      [{ id: 10, title: 'React Hooks 深入解析' }],
      favorites,
      keywords,
      1,
    )

    expect(result.matched).toEqual([
      {
        videoId: 10,
        videoTitle: 'React Hooks 深入解析',
        targetFavoriteId: 2,
        matchedTags: ['React'],
        isSourceMatch: false,
      },
    ])
    expect(result.unresolved).toEqual([])
  })

  it('多重命中时把候选收藏夹交给 AI', () => {
    const result = matchVideosByTags(
      [{ id: 11, title: 'TypeScript 全栈实践' }],
      favorites,
      keywords,
      1,
    )

    expect(result.matched).toEqual([])
    expect(result.unresolved[0].candidateFavoriteTitles).toEqual(['前端', '后端'])
    expect(result.unresolved[0].matchedTags).toEqual(['TypeScript'])
  })

  it('无命中时进入 AI 且没有候选收藏夹', () => {
    const result = matchVideosByTags(
      [{ id: 12, title: '旅行纪录片' }],
      favorites,
      keywords,
      1,
    )

    expect(result.unresolved[0].candidateFavoriteIds).toEqual([])
  })

  it('匹配时忽略首尾空格和大小写', () => {
    const result = matchVideosByTags(
      [{ id: 13, title: 'PYTHON 数据分析' }],
      favorites,
      [{ favoriteDataId: 3, value: [{ value: '  python  ' }] }],
      1,
    )

    expect(result.matched[0].targetFavoriteId).toBe(3)
    expect(result.matched[0].matchedTags).toEqual(['python'])
  })

  it('命中源收藏夹标签时优先保留原地', () => {
    const result = matchVideosByTags(
      [{ id: 14, title: '稍后看 TypeScript 教程' }],
      favorites,
      keywords,
      1,
    )

    expect(result.matched[0]).toMatchObject({
      targetFavoriteId: 1,
      isSourceMatch: true,
      matchedTags: ['稍后看'],
    })
    expect(result.unresolved).toEqual([])
  })
})
