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
    // 从 IndexedDB 恢复数据（含一次性迁移）
    const hydrate = async () => {
      try {
        const data: Record<string, any> = {}

        for (const key of INDEXEDDB_PERSISTED_KEYS) {
          let value = await dbManager.getTag(key)

          // 一次性迁移：IndexedDB 中没有时，尝试从 chrome.storage.local 旧位置读取
          if (value === null) {
            const legacyData = await chrome.storage.local.get(key)
            if (legacyData[key] !== undefined) {
              value = legacyData[key]
              await dbManager.setTag(key, value)
              // 迁移完成后清理旧存储位置，避免重复迁移
              await chrome.storage.local.remove(key)
            }
          }

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

    // 在内层 middleware（如 chromeStorageMiddleware）完成 api.setState 包装后再捕获，
    // 确保 setState 调用能触发所有层的持久化逻辑，形成链式调用。
    const savedSetState = api.setState

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
