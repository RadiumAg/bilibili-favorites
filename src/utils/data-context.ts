type Adapter = 'spark' | 'openai' | 'custom' | 'aigate' | 'qianwen' | 'kimi'

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
  }
  cookie: string | undefined
  activeKey: number | undefined
  defaultFavoriteId: number | undefined
  keyword: { value: { id: string; value: string }[]; favoriteDataId: number }[]
  setGlobalData: (data: Partial<DataContextType>) => void
  getGlobalData: () => DataContextType
}

export type { DataContextType, Adapter }
