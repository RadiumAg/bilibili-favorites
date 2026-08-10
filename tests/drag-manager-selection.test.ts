import { describe, expect, it } from 'vitest'
import { updateSelection } from '../src/options/components/drag-manager/selection'

describe('drag manager multi-selection', () => {
  it('连续点击不同项会追加多选', () => {
    const first = updateSelection(new Set<number>(), 1)
    const second = updateSelection(first, 2)

    expect(Array.from(second)).toEqual([1, 2])
  })

  it('重复点击已选项会反选', () => {
    const selected = new Set([1, 2])
    const next = updateSelection(selected, 1)

    expect(Array.from(next)).toEqual([2])
    expect(selected).toEqual(new Set([1, 2]))
  })

  it('普通视频 ID 和回收站 key 使用同一套选择规则', () => {
    const selected = updateSelection(new Set<string>(), 'folder:video:time', true)
    const unselected = updateSelection(selected, 'folder:video:time', false)

    expect(selected.has('folder:video:time')).toBe(true)
    expect(unselected.has('folder:video:time')).toBe(false)
  })
})
