import { describe, it, expect, vi } from 'vitest'
import { batchProcess } from '../src/utils/batch-process'

describe('batchProcess', () => {
  it('空数组不调用回调', async () => {
    const callback = vi.fn()
    await batchProcess([], { maxSize: 2, processCallback: callback })
    expect(callback).not.toHaveBeenCalled()
  })

  it('maxSize 大于数组长度时一次处理全部', async () => {
    const batches: any[][] = []
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }] as any[]

    await batchProcess(items, {
      maxSize: 10,
      processCallback: (videos) => {
        batches.push([...videos])
      },
    })

    expect(batches).toHaveLength(1)
    expect(batches[0]).toEqual(items)
  })

  it('按 maxSize 正确分批', async () => {
    const batches: any[][] = []
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }] as any[]

    await batchProcess(items, {
      maxSize: 2,
      processCallback: (videos) => {
        batches.push([...videos])
      },
    })

    expect(batches).toHaveLength(3)
    expect(batches[0]).toEqual([{ id: 1 }, { id: 2 }])
    expect(batches[1]).toEqual([{ id: 3 }, { id: 4 }])
    expect(batches[2]).toEqual([{ id: 5 }])
  })

  it('maxSize 为 1 时逐个处理', async () => {
    const batches: any[][] = []
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }] as any[]

    await batchProcess(items, {
      maxSize: 1,
      processCallback: (videos) => {
        batches.push([...videos])
      },
    })

    expect(batches).toHaveLength(3)
    expect(batches[0]).toEqual([{ id: 1 }])
    expect(batches[1]).toEqual([{ id: 2 }])
    expect(batches[2]).toEqual([{ id: 3 }])
  })

  it('刚好整除时不多调用', async () => {
    const batches: any[][] = []
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as any[]

    await batchProcess(items, {
      maxSize: 2,
      processCallback: (videos) => {
        batches.push([...videos])
      },
    })

    expect(batches).toHaveLength(2)
    expect(batches[0]).toEqual([{ id: 1 }, { id: 2 }])
    expect(batches[1]).toEqual([{ id: 3 }, { id: 4 }])
  })

  it('按顺序串行执行回调', async () => {
    const order: number[] = []
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }] as any[]

    await batchProcess(items, {
      maxSize: 1,
      processCallback: async (videos) => {
        const id = (videos[0] as any).id
        await new Promise((r) => setTimeout(r, 10 * (3 - id)))
        order.push(id)
      },
    })

    expect(order).toEqual([1, 2, 3])
  })

  it('回调抛错时 batchProcess 也抛错', async () => {
    const items = [{ id: 1 }, { id: 2 }] as any[]

    await expect(
      batchProcess(items, {
        maxSize: 1,
        processCallback: async () => {
          throw new Error('boom')
        },
      }),
    ).rejects.toThrow('boom')
  })
})
