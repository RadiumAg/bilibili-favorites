type Adapter = 'spark' | 'openai' | 'custom'

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
  }
  cookie: string | undefined
  activeKey: number | undefined
  defaultFavoriteId: number | undefined
  keyword: { value: { id: string; value: string }[]; favoriteDataId: number }[]
  setGlobalData: (data: Partial<DataContextType>) => void
  getGlobalData: () => DataContextType
}

export type { DataContextType, Adapter }
