import { StateCreator } from 'zustand'

// 定义需要持久化的字段
const PERSISTED_KEYS = ['keyword', 'activeKey', 'cookie', 'aiConfig', 'defaultFavoriteId'] as const

type PersistedKeys = (typeof PERSISTED_KEYS)[number]

const chromeStorageMiddleware: ChromeStorageImpl = (config) => {
  return (set, get, api) => {
    const savedSetState = api.setState

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
    }

    const configResult = config(
      (...args) => {
        set(...(args as Parameters<typeof set>))
        void persistState()
      },
      get,
      api,
    )

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
