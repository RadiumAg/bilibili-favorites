import { type WebDAVConfig } from './webdav'

type Adapter = 'spark' | 'openai' | 'custom' | 'aigate' | 'qianwen' | 'kimi' | 'gml'

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
    // 新增 AIGate 配置字段
    aigateUserId?: string
    aigateApiKeyId?: string
    // 配置模式：custom=自定义AI, free=内置免费AI
    configMode?: 'custom' | 'free'
  }
  cookie: string | undefined
  activeKey: number | undefined
  defaultFavoriteId: number | undefined
  keyword: { value: { id: string; value: string }[]; favoriteDataId: number }[]
  petEnabled: boolean
  // WebDAV 云同步配置（存 chrome.storage.local，不参与 WebDAV 同步）
  webdavConfig?: WebDAVConfig
  webdavEnabled: boolean
  webdavSyncIndexedDB: boolean
  webdavLastSyncTime?: number
  setGlobalData: (data: Partial<DataContextType>) => void
  getGlobalData: () => DataContextType
}

export type { DataContextType, Adapter }
