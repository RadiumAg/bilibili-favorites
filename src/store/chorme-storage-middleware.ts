import { StateCreator } from 'zustand'
import {
  INDEXEDDB_SYNC_KEYS,
  SYNC_KEYS,
  WEBDAV_LOCAL_MODIFIED_TIME_KEY,
  markWebDAVLocalModified,
} from '@/utils/sync-service'

// 定义需要持久化到 chrome.storage.local 的字段
// 注意：keyword（标签数据）已迁移到 IndexedDB，不在此处持久化
const PERSISTED_KEYS = [
  'activeKey',
  'cookie',
  'aiConfig',
  'defaultFavoriteId',
  'petEnabled',
  // WebDAV 云同步配置（仅本地持久化，不参与同步上传）
  'webdavConfig',
  'webdavEnabled',
  'webdavSyncIndexedDB',
  'webdavLastSyncTime',
  WEBDAV_LOCAL_MODIFIED_TIME_KEY,
] as const

type PersistedKeys = (typeof PERSISTED_KEYS)[number]
const AUTO_SYNC_KEYS = [...SYNC_KEYS, ...INDEXEDDB_SYNC_KEYS] as const

function isEqualForSync(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function hasAutoSyncFieldChanged(
  prevState: Record<string, any> | undefined,
  nextState: Record<string, any>,
): boolean {
  if (!prevState) return false
  return AUTO_SYNC_KEYS.some((key) => !isEqualForSync(prevState[key], nextState[key]))
}

const chromeStorageMiddleware: ChromeStorageImpl = (config) => {
  return (set, get, api) => {
    // 从 chrome.storage 恢复数据
    const hydrate = () => {
      chrome.storage.local.get(PERSISTED_KEYS as unknown as string[]).then((data) => {
        if (data && Object.keys(data).length > 0) {
          set(data as any)
        }
      })
    }

    // 只保存需要持久化的字段
    const persistState = (prevState?: Record<string, any>) => {
      const state = get() as Record<string, any>
      const dataToPersist: Record<string, any> = {}

      // 只提取需要持久化的字段
      PERSISTED_KEYS.forEach((key) => {
        if (key in state) {
          dataToPersist[key] = state[key]
        }
      })

      chrome.storage.local.set(dataToPersist)

      // WebDAV 自动同步：仅同步范围内字段变化时触发（静默失败）
      if (
        state.webdavEnabled &&
        state.webdavConfig &&
        !state.webdavApplyingRemote &&
        hasAutoSyncFieldChanged(prevState, state)
      ) {
        markWebDAVLocalModified().then(() => {
          chrome.runtime.sendMessage({ type: 'triggerSync' }).catch(() => {})
        })
      }
    }

    const configResult = config(
      (...args) => {
        const prevState = get() as Record<string, any>
        set(...(args as Parameters<typeof set>))
        void persistState(prevState)
      },
      get,
      api,
    )

    // 在内层 middleware 完成 api.setState 包装后再捕获，确保 setState 调用能触发所有层的持久化逻辑。
    const savedSetState = api.setState

    api.getInitialState = () => {
      return configResult
    }

    api.setState = (state, replace) => {
      const prevState = get() as Record<string, any>
      savedSetState(state, replace as any)
      persistState(prevState)
    }

    hydrate()

    return configResult
  }
}

type ChromeStorageImpl = <T>(storeInitializer: StateCreator<T, [], []>) => StateCreator<T, [], []>

export { chromeStorageMiddleware }
