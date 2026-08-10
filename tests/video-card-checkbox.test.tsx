import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VideoCard from '../src/options/components/drag-manager/video-card'

describe('VideoCard checkbox', () => {
  it('使用紧凑的 shadcn Checkbox 并支持独立多选', () => {
    const onCheckedChange = vi.fn()
    render(
      <VideoCard
        video={{ id: 1, title: '测试视频' }}
        selected={false}
        onClick={vi.fn()}
        onCheckedChange={onCheckedChange}
        onDragStart={vi.fn()}
      />,
    )

    const checkbox = screen.getByRole('checkbox', { name: '选中测试视频' })
    expect(checkbox.className).toContain('h-4')
    expect(checkbox.className).toContain('w-4')

    fireEvent.click(checkbox)
    expect(onCheckedChange).toHaveBeenCalledWith(1, true)
  })
})
