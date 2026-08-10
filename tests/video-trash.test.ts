import { describe, expect, it } from 'vitest'
import {
  VIDEO_TRASH_RETENTION_MS,
  createVideoTrashRecords,
  getVideoTrashRemainingDays,
} from '../src/utils/video-trash'

describe('video trash retention', () => {
  it('删除记录保留七天并保存原收藏夹信息', () => {
    const now = new Date('2026-08-10T00:00:00+08:00').getTime()
    const [record] = createVideoTrashRecords(
      [{ id: 12, title: '测试视频', cover: 'cover.jpg', bvid: 'BV1TEST' }],
      { id: 8, title: '技术' },
      now,
    )

    expect(record).toMatchObject({
      videoId: 12,
      title: '测试视频',
      originalFolderId: 8,
      originalFolderTitle: '技术',
      deletedAt: now,
      expiresAt: now + VIDEO_TRASH_RETENTION_MS,
    })
    expect(getVideoTrashRemainingDays(record, now)).toBe(7)
  })

  it('剩余时间按天向上取整，到期后为零', () => {
    const now = Date.now()
    const [record] = createVideoTrashRecords(
      [{ id: 1, title: '视频' }],
      { id: 2, title: '收藏夹' },
      now,
    )

    expect(getVideoTrashRemainingDays(record, record.expiresAt - 1)).toBe(1)
    expect(getVideoTrashRemainingDays(record, record.expiresAt)).toBe(0)
  })
})
