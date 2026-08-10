import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteVideoTrash: vi.fn(),
  putVideoTrash: vi.fn(),
  requestSync: vi.fn(),
}))

vi.mock('../src/utils/indexed-db', () => ({
  dbManager: {
    deleteVideoTrash: mocks.deleteVideoTrash,
    putVideoTrash: mocks.putVideoTrash,
  },
}))

vi.mock('../src/utils/sync-service', () => ({
  requestVideoTrashWebDAVSync: mocks.requestSync,
}))

import { createVideoTrashRecords, removeVideoTrash, saveVideoTrash } from '../src/utils/video-trash'

describe('video trash WebDAV trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.deleteVideoTrash.mockResolvedValue(undefined)
    mocks.putVideoTrash.mockResolvedValue(undefined)
    mocks.requestSync.mockResolvedValue(undefined)
  })

  it('保存回收站记录后触发 WebDAV 同步', async () => {
    const records = createVideoTrashRecords([{ id: 1, title: '视频' }], { id: 2, title: '收藏夹' })

    await saveVideoTrash(records)

    expect(mocks.putVideoTrash).toHaveBeenCalledWith(records)
    expect(mocks.requestSync).toHaveBeenCalledTimes(1)
  })

  it('恢复或永久删除记录后触发 WebDAV 同步', async () => {
    await removeVideoTrash(['2:1:time'])

    expect(mocks.deleteVideoTrash).toHaveBeenCalledWith(['2:1:time'])
    expect(mocks.requestSync).toHaveBeenCalledTimes(1)
  })
})
