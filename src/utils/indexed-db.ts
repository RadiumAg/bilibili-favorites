/**
 * IndexedDB 管理器 - 缓存分析数据
 */

interface CacheData {
  key: string
  data: any
  timestamp: number
}

const DB_NAME = 'bilibili-favorites-db'
const DB_VERSION = 1
const STORE_NAME = 'analysis-cache'

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
}

export const dbManager = new IndexedDBManager()
export default dbManager
