/**
 * IndexedDB 管理器 - 缓存分析数据
 */

type CacheData = {
  key: string
  data: any
  timestamp: number
}

const DB_NAME = 'bilibili-favorites-db'
const DB_VERSION = 2
const STORE_NAME = 'analysis-cache'
const TAG_STORE_NAME = 'tag-storage'

class IndexedDBManager {
  private db: IDBDatabase | null = null

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(TAG_STORE_NAME)) {
          db.createObjectStore(TAG_STORE_NAME, { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * 获取缓存数据
   */
  async get(key: string): Promise<CacheData | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result as CacheData | undefined
        resolve(result || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 保存缓存数据
   */
  async set(key: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    const cacheData: CacheData = {
      key,
      data,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(cacheData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除指定缓存
   */
  async delete(key: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 检查缓存是否过期 (默认24小时)
   */
  async isExpired(key: string, maxAge = 24 * 60 * 60 * 1000): Promise<boolean> {
    const cached = await this.get(key)
    if (!cached) return true

    return Date.now() - cached.timestamp > maxAge
  }

  /**
   * 获取标签数据
   */
  async getTag(key: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TAG_STORE_NAME], 'readonly')
      const store = transaction.objectStore(TAG_STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result as { key: string; data: any } | undefined
        resolve(result ? result.data : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 保存标签数据
   */
  async setTag(key: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TAG_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(TAG_STORE_NAME)
      const request = store.put({ key, data })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const dbManager = new IndexedDBManager()
export default dbManager
