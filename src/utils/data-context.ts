import { type WebDAVConfig } from './webdav'

type Adapter = 'spark' | 'openai' | 'custom' | 'qianwen' | 'kimi' | 'gml'

type DataContextType = {
  favoriteData: {
    attr: number
    fav_state: number
    fid: number
    id: number
    media_count: number
    mid: number
    title: string
  }[]
  aiConfig: {
    key?: string
    baseUrl?: string
    model?: string
    adapter?: Adapter
    extraParams?: Record<string, any>
    // 仅保留自定义 AI。configMode 用于兼容旧版本持久化数据。
    configMode?: 'custom'
  }
  cookie: string | undefined
  activeKey: number | undefined
  defaultFavoriteId: number | undefined
  keyword: { value: { id: string; value: string }[]; favoriteDataId: number }[]
  petEnabled: boolean
  /** 自动创建标签失败标识：favoriteId -> 错误摘要 */
  aiTagFailures: Record<string, string>
  // WebDAV 云同步配置（存 chrome.storage.local，不参与 WebDAV 同步）
  webdavConfig?: WebDAVConfig
  webdavEnabled: boolean
  webdavSyncIndexedDB: boolean
  webdavLastSyncTime?: number
  webdavLocalModifiedTime?: number
  webdavApplyingRemote?: boolean
  setGlobalData: (data: Partial<DataContextType>) => void
  getGlobalData: () => DataContextType
}

export type { DataContextType, Adapter }
