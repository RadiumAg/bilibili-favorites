import { StateCreator } from 'zustand'
import { dbManager } from '@/utils/indexed-db'

/**
 * 需要持久化到 IndexedDB 的字段
 * 适合存储体积较大、访问频率高的标签/缓存类数据
 */
const INDEXEDDB_PERSISTED_KEYS = ['keyword'] as const

type IndexedDBPersistedKeys = (typeof INDEXEDDB_PERSISTED_KEYS)[number]

const indexedDBStorageMiddleware: IndexedDBStorageImpl = (config) => {
  return (set, get, api) => {
    const savedSetState = api.setState

    // 从 IndexedDB 恢复数据
    const hydrate = async () => {
      try {
        const data: Record<string, any> = {}

        for (const key of INDEXEDDB_PERSISTED_KEYS) {
          const value = await dbManager.getTag(key)
          if (value !== null) {
            data[key] = value
          }
        }

        if (Object.keys(data).length > 0) {
          set(data as any)
        }
      } catch (error) {
        console.warn('[IndexedDBStorage] hydrate failed:', error)
      }
    }

    // 只保存需要持久化的字段
    const persistState = async () => {
      try {
        const state = get() as Record<string, any>

        for (const key of INDEXEDDB_PERSISTED_KEYS) {
          if (key in state) {
            await dbManager.setTag(key, state[key])
          }
        }
      } catch (error) {
        console.warn('[IndexedDBStorage] persist failed:', error)
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

    api.getInitialState = () => {
      return configResult
    }

    api.setState = (state, replace) => {
      savedSetState(state, replace as any)
      void persistState()
    }

    hydrate()

    return configResult
  }
}

type IndexedDBStorageImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], []>

export { indexedDBStorageMiddleware }
