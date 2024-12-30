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
  activeKey: number | undefined
  keyword: { value: string[]; favoriteDataId: number }[]
  dispatch: React.Dispatch<React.SetStateAction<Omit<DataContextType, 'dispatch'>>> | null
}

const DataContext = React.createContext<DataContextType>({
  favoriteData: [],
  keyword: [],
  activeKey: undefined,
  dispatch: null,
})

export { DataContext }
export type { DataContextType }
