import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VideoTrashRecord } from '../src/utils/indexed-db'

const mocks = vi.hoisted(() => ({
  ensureDirectory: vi.fn(),
  get: vi.fn(),
  getVideoTrash: vi.fn(),
  put: vi.fn(),
  replaceVideoTrash: vi.fn(),
}))

vi.mock('../src/utils/webdav', () => ({
  connect: vi.fn(),
  ensureDirectory: mocks.ensureDirectory,
  get: mocks.get,
  propfind: vi.fn(),
  put: mocks.put,
}))

vi.mock('../src/utils/indexed-db', () => ({
  DB_NAME: 'test-db',
  DB_VERSION: 1,
  default: {
    getVideoTrash: mocks.getVideoTrash,
    replaceVideoTrash: mocks.replaceVideoTrash,
  },
}))

import {
  WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY,
  WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY,
  requestVideoTrashWebDAVSync,
  syncVideoTrashWithWebDAV,
} from '../src/utils/sync-service'

const config = {
  serverUrl: 'https://dav.example.com',
  username: 'tester',
  password: 'secret',
}

const createRecord = (key: string, deletedAt: number): VideoTrashRecord => ({
  key,
  videoId: deletedAt,
  title: key,
  originalFolderId: 1,
  originalFolderTitle: '默认收藏夹',
  deletedAt,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
})

describe('video trash WebDAV sync', () => {
  let storageData: Record<string, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    storageData = {}
    mocks.ensureDirectory.mockResolvedValue(undefined)
    mocks.put.mockResolvedValue(true)
    mocks.replaceVideoTrash.mockResolvedValue(undefined)
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: (keys: string | string[], callback: (data: Record<string, unknown>) => void) => {
            const requestedKeys = Array.isArray(keys) ? keys : [keys]
            callback(Object.fromEntries(requestedKeys.map((key) => [key, storageData[key]])))
          },
          set: (data: Record<string, unknown>, callback: () => void) => {
            Object.assign(storageData, data)
            callback()
          },
        },
      },
      runtime: {
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('远端更新时覆盖本地 IndexedDB 快照', async () => {
    const localRecord = createRecord('local', 1)
    const remoteRecord = createRecord('remote', 2)
    storageData[WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY] = 100
    storageData[WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY] = 100
    mocks.getVideoTrash.mockResolvedValue([localRecord])
    mocks.get.mockResolvedValue(
      JSON.stringify({ version: 1, updatedAt: 200, records: [remoteRecord] }),
    )

    const result = await syncVideoTrashWithWebDAV(config)

    expect(result).toEqual({ direction: 'downloaded', records: [remoteRecord] })
    expect(mocks.replaceVideoTrash).toHaveBeenCalledWith([remoteRecord])
    expect(storageData[WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY]).toBe(200)
  })

  it('本地更新时上传当前回收站快照', async () => {
    const localRecord = createRecord('local', 3)
    storageData[WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY] = 100
    storageData[WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY] = 300
    mocks.getVideoTrash.mockResolvedValue([localRecord])
    mocks.get.mockResolvedValue(JSON.stringify({ version: 1, updatedAt: 200, records: [] }))

    const result = await syncVideoTrashWithWebDAV(config)

    expect(result.direction).toBe('uploaded')
    expect(mocks.put).toHaveBeenCalledWith(
      config,
      '/video-trash/data.json',
      expect.stringContaining('"key": "local"'),
    )
    expect(mocks.replaceVideoTrash).not.toHaveBeenCalled()
  })

  it('首次接入时合并两端现有记录', async () => {
    const localRecord = createRecord('local', 4)
    const remoteRecord = createRecord('remote', 5)
    mocks.getVideoTrash.mockResolvedValue([localRecord])
    mocks.get.mockResolvedValue(
      JSON.stringify({ version: 1, updatedAt: 200, records: [remoteRecord] }),
    )

    const result = await syncVideoTrashWithWebDAV(config)

    expect(result.direction).toBe('uploaded')
    expect(result.records.map((record) => record.key)).toEqual(['remote', 'local'])
    expect(mocks.replaceVideoTrash).toHaveBeenCalledWith(result.records)
  })

  it('本地修改时间始终晚于上次同步时间', async () => {
    const futureSyncTime = Date.now() + 10_000
    storageData.webdavEnabled = true
    storageData.webdavConfig = config
    storageData[WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY] = futureSyncTime
    storageData[WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY] = futureSyncTime

    await requestVideoTrashWebDAVSync()

    expect(storageData[WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY]).toBe(futureSyncTime + 1)
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'triggerSync' })
  })
})
