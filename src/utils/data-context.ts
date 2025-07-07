import React from 'react'

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
  }
  cookie: string | undefined
  activeKey: number | undefined
  defaultFavoriteId: number | undefined
  keyword: { value: { id: string; value: string }[]; favoriteDataId: number }[]
  setGlobalData: (data: Partial<DataContextType>) => void
}

export type { DataContextType }
