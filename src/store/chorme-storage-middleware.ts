import { StateCreator } from 'zustand'

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
] as const

type PersistedKeys = (typeof PERSISTED_KEYS)[number]

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
    const persistState = () => {
      const state = get() as Record<string, any>
      const dataToPersist: Record<string, any> = {}

      // 只提取需要持久化的字段
      PERSISTED_KEYS.forEach((key) => {
        if (key in state) {
          dataToPersist[key] = state[key]
        }
      })

      chrome.storage.local.set(dataToPersist)

      // WebDAV 自动同步：通知 background 触发上传（静默失败）
      if (state.webdavEnabled && state.webdavConfig) {
        chrome.runtime.sendMessage({ type: 'triggerSync' }).catch(() => {})
      }
    }

    const configResult = config(
      (...args) => {
        set(...(args as Parameters<typeof set>))
        void persistState()
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
      savedSetState(state, replace as any)
      persistState()
    }

    hydrate()

    return configResult
  }
}

type ChromeStorageImpl = <T>(storeInitializer: StateCreator<T, [], []>) => StateCreator<T, [], []>

export { chromeStorageMiddleware }
