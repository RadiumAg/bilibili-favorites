import { DataContextType } from '@/utils/data-context'
import { create } from 'zustand'
import { chormeStorageMiddleware } from './chorme-storage-middleware'

const useGlobalDateStore = create<DataContextType>()(
  chormeStorageMiddleware((set) => {
    return {
      keyword: [],
      favoriteData: [],
      cookie: undefined,
      activeKey: undefined,
      aiConfig: {},
      defaultFavoriteId: undefined,

      setGlobalData: (data: Partial<DataContextType>) => {
        return set(data)
      },
    }
  }),
)

export { useGlobalDateStore }
