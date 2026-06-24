/**
 * WebDAV 同步服务 - 管理数据的上传、下载和冲突解决
 */

import { type WebDAVConfig, connect, put, get, propfind, ensureDirectory } from './webdav'
import dbManager, { DB_NAME, DB_VERSION } from './indexed-db'

/** 同步状态 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

/** 同步元数据 */
type SyncMeta = {
  lastModified: number
  version: string
  deviceId: string
}

export type SyncSettings = Partial<
  Record<(typeof SYNC_KEYS)[number] | (typeof INDEXEDDB_SYNC_KEYS)[number], any>
>

export type DownloadSyncResult = {
  hasNew: boolean
  settings?: SyncSettings
  remoteLastModified?: number
}

/** 需要同步的 Chrome Storage 字段（排除 cookie 和已迁移到 IndexedDB 的 keyword） */
export const SYNC_KEYS = ['activeKey', 'aiConfig', 'defaultFavoriteId', 'petEnabled'] as const

/** 已迁移到 IndexedDB 但仍需参与 WebDAV 同步的字段 */
export const INDEXEDDB_SYNC_KEYS = ['keyword'] as const

export const WEBDAV_LOCAL_MODIFIED_TIME_KEY = 'webdavLocalModifiedTime'
export const WEBDAV_LAST_SYNC_TIME_KEY = 'webdavLastSyncTime'

/** 应用版本号 */
const SYNC_VERSION = '1.0'

/** 获取或生成设备 ID */
function getDeviceId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get('_deviceId', (data) => {
      if (data._deviceId) {
        resolve(data._deviceId)
      } else {
        const id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        chrome.storage.local.set({ _deviceId: id })
        resolve(id)
      }
    })
  })
}

/** 获取 WebDAV 配置 */
export function getWebDAVConfig(): Promise<WebDAVConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['webdavConfig', 'webdavEnabled'], (data) => {
      if (data.webdavEnabled && data.webdavConfig) {
        resolve(data.webdavConfig as WebDAVConfig)
      } else {
        resolve(null)
      }
    })
  })
}

/** 获取本地同步时间戳 */
export function getLocalSyncTime(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get(WEBDAV_LAST_SYNC_TIME_KEY, (data) => {
      resolve(data[WEBDAV_LAST_SYNC_TIME_KEY] || 0)
    })
  })
}

/** 保存本地同步时间戳 */
function setLocalSyncTime(time: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [WEBDAV_LAST_SYNC_TIME_KEY]: time }, resolve)
  })
}

/** 获取本地数据最后修改时间 */
export function getLocalModifiedTime(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get(WEBDAV_LOCAL_MODIFIED_TIME_KEY, (data) => {
      resolve(data[WEBDAV_LOCAL_MODIFIED_TIME_KEY] || 0)
    })
  })
}

/** 标记本地同步范围内的数据已修改 */
export function markWebDAVLocalModified(time = Date.now()): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [WEBDAV_LOCAL_MODIFIED_TIME_KEY]: time }, resolve)
  })
}

function setLocalModifiedTime(time: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [WEBDAV_LOCAL_MODIFIED_TIME_KEY]: time }, resolve)
  })
}

/** 是否同步 IndexedDB */
function getSyncIndexedDBOption(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get('webdavSyncIndexedDB', (data) => {
      resolve(data.webdavSyncIndexedDB === true)
    })
  })
}

function pickSyncSettings(settings: Record<string, any>): SyncSettings {
  const picked: SyncSettings = {}

  for (const key of SYNC_KEYS) {
    if (key in settings) {
      picked[key] = settings[key]
    }
  }

  for (const key of INDEXEDDB_SYNC_KEYS) {
    if (key in settings) {
      picked[key] = settings[key]
    }
  }

  return picked
}

async function applySyncSettingsToStorage(settings: SyncSettings): Promise<void> {
  const storageData: Record<string, any> = {}

  for (const key of SYNC_KEYS) {
    if (key in settings) {
      storageData[key] = settings[key]
    }
  }

  if (Object.keys(storageData).length > 0) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set(storageData, resolve)
    })
  }

  for (const key of INDEXEDDB_SYNC_KEYS) {
    if (key in settings) {
      await dbManager.setTag(key, settings[key])
    }
  }
}

/**
 * 上传同步 - 将本地数据上传到 WebDAV
 */
export async function uploadSync(): Promise<void> {
  const config = await getWebDAVConfig()
  if (!config) throw new Error('WebDAV 未配置')

  // 确保目录存在
  await ensureDirectory(config, '/')

  // 1. 获取需要同步的 chrome.storage 数据
  const storageData = await new Promise<Record<string, any>>((resolve) => {
    chrome.storage.local.get(SYNC_KEYS as unknown as string[], resolve)
  })

  // 2. 补充从 IndexedDB 读取的同步字段（如标签数据 keyword）
  for (const key of INDEXEDDB_SYNC_KEYS) {
    storageData[key] = await dbManager.getTag(key)
  }

  // 3. 上传 settings.json
  await put(config, '/settings.json', JSON.stringify(storageData, null, 2))

  // 4. 可选：上传 IndexedDB 分析缓存
  const syncIndexedDB = await getSyncIndexedDBOption()
  if (syncIndexedDB) {
    await ensureDirectory(config, '/analysis-cache/')
    await uploadIndexedDBData(config)
  }

  // 5. 更新 sync-meta.json
  const deviceId = await getDeviceId()
  const meta: SyncMeta = {
    lastModified: Date.now(),
    version: SYNC_VERSION,
    deviceId,
  }
  await put(config, '/sync-meta.json', JSON.stringify(meta, null, 2))

  // 6. 更新本地同步时间
  await setLocalSyncTime(meta.lastModified)
  await setLocalModifiedTime(meta.lastModified)
}

/**
 * 下载同步 - 从 WebDAV 拉取最新数据到本地
 */
export async function downloadSync(options?: {
  applyToStorage?: boolean
}): Promise<DownloadSyncResult> {
  const applyToStorage = options?.applyToStorage !== false
  const config = await getWebDAVConfig()
  debugger
  if (!config) throw new Error('WebDAV 未配置')

  // 1. 获取远端 meta
  const metaStr = await get(config, '/sync-meta.json')
  if (!metaStr) {
    // 远端无数据，执行首次上传
    await uploadSync()
    return { hasNew: false }
  }

  const remoteMeta: SyncMeta = JSON.parse(metaStr)
  const localSyncTime = await getLocalSyncTime()

  // 2. 判断是否需要同步（远端更新时间 > 本地同步时间）
  if (remoteMeta.lastModified <= localSyncTime) {
    return { hasNew: false } // 无需同步
  }

  // 3. 下载 settings.json
  const settingsStr = await get(config, '/settings.json')
  let syncSettings: SyncSettings | undefined
  if (settingsStr) {
    const settings = JSON.parse(settingsStr)
    syncSettings = pickSyncSettings(settings)
    if (applyToStorage) {
      await applySyncSettingsToStorage(syncSettings)
    }
  }

  // 4. 可选：下载 IndexedDB 分析缓存
  const syncIndexedDB = await getSyncIndexedDBOption()
  if (syncIndexedDB) {
    await downloadIndexedDBData(config)
  }

  // 5. 更新本地同步时间
  if (applyToStorage) {
    await setLocalSyncTime(remoteMeta.lastModified)
    await setLocalModifiedTime(remoteMeta.lastModified)
  }

  return {
    hasNew: true,
    settings: syncSettings,
    remoteLastModified: remoteMeta.lastModified,
  }
}

/**
 * 冲突解决：last-write-wins
 * 比较远端和本地时间戳，决定方向
 */
export async function resolveAndSync(): Promise<'uploaded' | 'downloaded' | 'none'> {
  const config = await getWebDAVConfig()
  if (!config) return 'none'

  try {
    const metaStr = await get(config, '/sync-meta.json')
    const localSyncTime = await getLocalSyncTime()
    const localModifiedTime = await getLocalModifiedTime()
    const hasLocalChanges = localModifiedTime > localSyncTime

    if (!metaStr) {
      // 远端无数据，上传本地数据
      await uploadSync()
      return 'uploaded'
    }

    const remoteMeta: SyncMeta = JSON.parse(metaStr)

    const hasRemoteChanges = remoteMeta.lastModified > localSyncTime

    if (hasRemoteChanges && hasLocalChanges) {
      // 两端均有修改，使用 last-write-wins
      if (remoteMeta.lastModified >= localModifiedTime) {
        await downloadSync()
        return 'downloaded'
      }
      await uploadSync()
      return 'uploaded'
    }

    if (hasRemoteChanges) {
      await downloadSync()
      return 'downloaded'
    }

    if (hasLocalChanges) {
      await uploadSync()
      return 'uploaded'
    }

    return 'none'
  } catch (error) {
    console.error('[SyncService] resolveAndSync failed:', error)
    return 'none'
  }
}

/**
 * 获取同步状态信息
 */
export async function getSyncInfo(): Promise<{
  lastSyncTime: number
  localModifiedTime: number
  remoteLastModified: number | null
}> {
  const config = await getWebDAVConfig()
  const lastSyncTime = await getLocalSyncTime()
  const localModifiedTime = await getLocalModifiedTime()

  if (!config) return { lastSyncTime, localModifiedTime, remoteLastModified: null }

  try {
    const metaInfo = await propfind(config, '/sync-meta.json')
    return {
      lastSyncTime,
      localModifiedTime,
      remoteLastModified: metaInfo?.lastModified ?? null,
    }
  } catch {
    return { lastSyncTime, localModifiedTime, remoteLastModified: null }
  }
}

/**
 * 测试 WebDAV 连接
 */
export async function testConnection(config: WebDAVConfig): Promise<boolean> {
  return connect(config)
}

// ========== IndexedDB 同步辅助 ==========

async function uploadIndexedDBData(config: WebDAVConfig): Promise<void> {
  try {
    // 获取所有 IndexedDB 中的 keys（通过遍历）
    const allKeys = await getAllIndexedDBKeys()
    const allData: Record<string, any> = {}

    for (const key of allKeys) {
      const cached = await dbManager.get(key)
      if (cached) {
        allData[key] = cached
      }
    }

    if (Object.keys(allData).length > 0) {
      await put(config, '/analysis-cache/data.json', JSON.stringify(allData))
    }
  } catch (error) {
    throw new Error(
      `IndexedDB 分析缓存上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
    )
  }
}

async function downloadIndexedDBData(config: WebDAVConfig): Promise<void> {
  try {
    const dataStr = await get(config, '/analysis-cache/data.json')
    if (!dataStr) return

    const allData: Record<string, { key: string; data: any; timestamp: number }> =
      JSON.parse(dataStr)

    for (const [key, entry] of Object.entries(allData)) {
      if (entry && entry.data) {
        await dbManager.set(key, entry.data)
      }
    }
  } catch (error) {
    console.warn('[SyncService] downloadIndexedDBData failed:', error)
  }
}

/**
 * 获取 IndexedDB 中所有缓存 key
 */
function getAllIndexedDBKeys(): Promise<string[]> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => resolve([])
    request.onsuccess = () => {
      const db = request.result
      try {
        const transaction = db.transaction(['analysis-cache'], 'readonly')
        const store = transaction.objectStore('analysis-cache')
        const keysRequest = store.getAllKeys()
        keysRequest.onsuccess = () => resolve(keysRequest.result as string[])
        keysRequest.onerror = () => resolve([])
      } catch {
        resolve([])
      }
    }
  })
}
