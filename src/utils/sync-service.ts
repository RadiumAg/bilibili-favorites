/**
 * WebDAV 同步服务 - 管理数据的上传、下载和冲突解决
 */

import { type WebDAVConfig, connect, put, get, propfind, ensureDirectory } from './webdav'
import dbManager, { DB_NAME, DB_VERSION, type VideoTrashRecord } from './indexed-db'

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

type VideoTrashSyncData = {
  version: 1
  updatedAt: number
  records: VideoTrashRecord[]
}

export type VideoTrashSyncResult = {
  direction: 'uploaded' | 'downloaded' | 'none'
  records: VideoTrashRecord[]
}

/** 需要同步的 Chrome Storage 字段（排除 cookie 和已迁移到 IndexedDB 的 keyword） */
export const SYNC_KEYS = ['activeKey', 'aiConfig', 'defaultFavoriteId', 'petEnabled'] as const

/** 已迁移到 IndexedDB 但仍需参与 WebDAV 同步的字段 */
export const INDEXEDDB_SYNC_KEYS = ['keyword'] as const

export const WEBDAV_LOCAL_MODIFIED_TIME_KEY = 'webdavLocalModifiedTime'
export const WEBDAV_LAST_SYNC_TIME_KEY = 'webdavLastSyncTime'
export const WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY = 'webdavVideoTrashLocalModifiedTime'
export const WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY = 'webdavVideoTrashLastSyncTime'

/** 应用版本号 */
const SYNC_VERSION = '1.0'
const VIDEO_TRASH_SYNC_PATH = '/video-trash/data.json'
const AI_CONFIG_SECRET_KEYS = ['key', 'apiKey'] as const

function isPlainRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** WebDAV 配置同步不得携带 AI 密钥。返回副本，避免修改本地持久化对象。 */
export function sanitizeAIConfigForWebDAV(aiConfig: unknown): unknown {
  if (!isPlainRecord(aiConfig)) return aiConfig

  const sanitized = { ...aiConfig }
  for (const key of AI_CONFIG_SECRET_KEYS) {
    delete sanitized[key]
  }
  return sanitized
}

/** 应用远端 AI 配置时仅恢复本机已有密钥，远端永远不能注入/覆盖密钥。 */
export function mergeAIConfigFromWebDAV(localConfig: unknown, remoteConfig: unknown): unknown {
  const sanitizedRemote = sanitizeAIConfigForWebDAV(remoteConfig)
  if (!isPlainRecord(sanitizedRemote)) return sanitizedRemote

  const merged = { ...sanitizedRemote }
  if (isPlainRecord(localConfig)) {
    for (const key of AI_CONFIG_SECRET_KEYS) {
      if (key in localConfig) {
        merged[key] = localConfig[key]
      }
    }
  }
  return merged
}

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

function getStorageTime(key: string): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (data) => {
      resolve(typeof data[key] === 'number' ? data[key] : 0)
    })
  })
}

function setStorageTime(key: string, time: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: time }, resolve)
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

  if ('aiConfig' in picked) {
    picked.aiConfig = sanitizeAIConfigForWebDAV(picked.aiConfig)
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

  if ('aiConfig' in storageData) {
    const localAIConfig = await new Promise<unknown>((resolve) => {
      chrome.storage.local.get('aiConfig', (data) => resolve(data.aiConfig))
    })
    storageData.aiConfig = mergeAIConfigFromWebDAV(localAIConfig, storageData.aiConfig)
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

  if ('aiConfig' in storageData) {
    storageData.aiConfig = sanitizeAIConfigForWebDAV(storageData.aiConfig)
  }

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

  // 5. 回收站始终单独同步，不受“分析缓存”开关影响
  await syncVideoTrashWithWebDAV(config)

  // 6. 更新 sync-meta.json
  const deviceId = await getDeviceId()
  const meta: SyncMeta = {
    lastModified: Date.now(),
    version: SYNC_VERSION,
    deviceId,
  }
  await put(config, '/sync-meta.json', JSON.stringify(meta, null, 2))

  // 7. 更新本地同步时间
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
  if (!config) throw new Error('WebDAV 未配置')

  // 回收站有独立同步时间，即使通用配置没有更新也要检查远端。
  await syncVideoTrashWithWebDAV(config)

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

function isVideoTrashRecord(value: unknown): value is VideoTrashRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<VideoTrashRecord>
  return (
    typeof record.key === 'string' &&
    typeof record.videoId === 'number' &&
    typeof record.title === 'string' &&
    typeof record.originalFolderId === 'number' &&
    typeof record.originalFolderTitle === 'string' &&
    typeof record.deletedAt === 'number' &&
    typeof record.expiresAt === 'number'
  )
}

function normalizeVideoTrashRecords(records: unknown, now = Date.now()): VideoTrashRecord[] {
  if (!Array.isArray(records)) return []

  const recordMap = new Map<string, VideoTrashRecord>()
  records.forEach((record) => {
    if (isVideoTrashRecord(record) && record.expiresAt > now) {
      recordMap.set(record.key, record)
    }
  })

  return Array.from(recordMap.values()).sort((a, b) => b.deletedAt - a.deletedAt)
}

function parseVideoTrashSyncData(data: string, now = Date.now()): VideoTrashSyncData {
  const parsed: unknown = JSON.parse(data)

  if (Array.isArray(parsed)) {
    return { version: 1, updatedAt: 0, records: normalizeVideoTrashRecords(parsed, now) }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('WebDAV 回收站数据格式异常')
  }

  const payload = parsed as Partial<VideoTrashSyncData>
  return {
    version: 1,
    updatedAt: typeof payload.updatedAt === 'number' ? payload.updatedAt : 0,
    records: normalizeVideoTrashRecords(payload.records, now),
  }
}

function mergeVideoTrashRecords(
  localRecords: VideoTrashRecord[],
  remoteRecords: VideoTrashRecord[],
): VideoTrashRecord[] {
  return normalizeVideoTrashRecords([...localRecords, ...remoteRecords])
}

async function uploadVideoTrashSnapshot(
  config: WebDAVConfig,
  records: VideoTrashRecord[],
  updatedAt: number,
): Promise<void> {
  const payload: VideoTrashSyncData = { version: 1, updatedAt, records }
  await put(config, VIDEO_TRASH_SYNC_PATH, JSON.stringify(payload, null, 2))
  await Promise.all([
    setStorageTime(WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY, updatedAt),
    setStorageTime(WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY, updatedAt),
  ])
}

/**
 * 同步回收站快照。首次接入会合并两端数据，之后按独立修改时间解决冲突。
 */
export async function syncVideoTrashWithWebDAV(
  configOverride?: WebDAVConfig,
): Promise<VideoTrashSyncResult> {
  const config = configOverride ?? (await getWebDAVConfig())
  const localRecords = await dbManager.getVideoTrash()
  if (!config) return { direction: 'none', records: localRecords }

  await ensureDirectory(config, '/video-trash/')
  const [remoteData, lastSyncTime, localModifiedTime] = await Promise.all([
    get(config, VIDEO_TRASH_SYNC_PATH),
    getStorageTime(WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY),
    getStorageTime(WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY),
  ])

  if (!remoteData) {
    const updatedAt = Math.max(localModifiedTime, Date.now())
    await uploadVideoTrashSnapshot(config, localRecords, updatedAt)
    return { direction: 'uploaded', records: localRecords }
  }

  const remote = parseVideoTrashSyncData(remoteData)

  // 旧版本升级时还没有本地同步时间，先合并，避免任一端现有记录丢失。
  if (lastSyncTime === 0 && localRecords.length > 0) {
    const records = mergeVideoTrashRecords(localRecords, remote.records)
    const updatedAt = Math.max(Date.now(), localModifiedTime, remote.updatedAt + 1)
    await dbManager.replaceVideoTrash(records)
    await uploadVideoTrashSnapshot(config, records, updatedAt)
    return { direction: 'uploaded', records }
  }

  if (
    lastSyncTime === 0 &&
    localModifiedTime === 0 &&
    remote.updatedAt === 0 &&
    remote.records.length > 0
  ) {
    const updatedAt = Date.now()
    await dbManager.replaceVideoTrash(remote.records)
    await uploadVideoTrashSnapshot(config, remote.records, updatedAt)
    return { direction: 'downloaded', records: remote.records }
  }

  const hasLocalChanges = localModifiedTime > lastSyncTime
  const hasRemoteChanges = remote.updatedAt > lastSyncTime

  if (hasLocalChanges && (!hasRemoteChanges || localModifiedTime > remote.updatedAt)) {
    await uploadVideoTrashSnapshot(config, localRecords, localModifiedTime)
    return { direction: 'uploaded', records: localRecords }
  }

  if (hasRemoteChanges) {
    await dbManager.replaceVideoTrash(remote.records)
    await Promise.all([
      setStorageTime(WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY, remote.updatedAt),
      setStorageTime(WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY, remote.updatedAt),
    ])
    return { direction: 'downloaded', records: remote.records }
  }

  if (hasLocalChanges) {
    await uploadVideoTrashSnapshot(config, localRecords, localModifiedTime)
    return { direction: 'uploaded', records: localRecords }
  }

  return { direction: 'none', records: localRecords }
}

/** 标记回收站已修改，并复用后台防抖同步。 */
export async function requestVideoTrashWebDAVSync(): Promise<void> {
  const config = await getWebDAVConfig()
  if (!config) return

  const [lastSyncTime, previousModifiedTime] = await Promise.all([
    getStorageTime(WEBDAV_VIDEO_TRASH_LAST_SYNC_TIME_KEY),
    getStorageTime(WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY),
  ])
  const modifiedAt = Math.max(Date.now(), lastSyncTime + 1, previousModifiedTime + 1)
  await Promise.all([
    markWebDAVLocalModified(modifiedAt),
    setStorageTime(WEBDAV_VIDEO_TRASH_LOCAL_MODIFIED_TIME_KEY, modifiedAt),
  ])
  await chrome.runtime.sendMessage({ type: 'triggerSync' }).catch((error) => {
    console.warn('[SyncService] request video trash sync failed:', error)
  })
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
