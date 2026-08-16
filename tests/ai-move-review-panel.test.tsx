import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ReviewPanel from '../src/popup/components/ai-move/review-panel'
import TagSuggestionCard from '../src/popup/components/ai-move/tag-suggestion-card'

const favorites = [
  { id: 1, title: '默认收藏夹' },
  { id: 2, title: '前端开发' },
]

describe('smart organize review UI', () => {
  it('按标签命中、AI 建议顺序分组，并显示各自依据', () => {
    render(
      <ReviewPanel
        results={[
          {
            status: 'pending',
            source: 'ai',
            targetFavoriteId: 2,
            videoId: 20,
            videoTitle: 'AI 视频',
            reason: 'AI 推荐理由',
            selected: true,
          },
          {
            status: 'pending',
            source: 'tag',
            targetFavoriteId: 2,
            videoId: 10,
            videoTitle: '标签视频',
            reason: '标签唯一命中',
            matchedTags: ['React', 'Hooks', 'TypeScript'],
            selected: true,
          },
        ]}
        favorites={favorites}
        sourceFavoriteId={1}
        onTargetChange={vi.fn()}
        onSelectionChange={vi.fn()}
        onSelectAllTagResults={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    const articles = screen.getAllByRole('article')
    expect(articles[0].textContent).toContain('标签视频')
    expect(articles[0].textContent).toContain('React')
    expect(articles[0].textContent).toContain('+1')
    expect(articles[1].textContent).toContain('AI 视频')
    expect(articles[1].textContent).toContain('AI 推荐理由')
    expect(screen.getByText('标签命中 · 1 个（建议直接确认）')).not.toBeNull()
    expect(screen.getByText('AI 建议 · 1 个（请核对）')).not.toBeNull()
  })

  it('标签建议支持切换候选词并采纳选中项', async () => {
    const onAdopt = vi.fn().mockResolvedValue(2)
    render(
      <TagSuggestionCard
        groups={[
          {
            favoriteId: 2,
            favoriteTitle: '前端开发',
            videoCount: 3,
            candidates: ['React', 'Hooks', 'TypeScript'],
          },
        ]}
        onAdopt={onAdopt}
        onDismiss={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'TypeScript' }))
    fireEvent.click(screen.getByRole('button', { name: '采纳 2 个' }))

    await waitFor(() => {
      expect(onAdopt).toHaveBeenCalledWith(2, ['React', 'Hooks'])
    })
    expect(await screen.findByText('已添加 2 个标签到「前端开发」')).not.toBeNull()
  })
})
