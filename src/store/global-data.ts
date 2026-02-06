import { DataContextType } from '@/utils/data-context'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { chromeStorageMiddleware } from './chorme-storage-middleware'

const useGlobalConfig = create<DataContextType>()(
  immer(
    chromeStorageMiddleware((set, get) => {
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
        getGlobalData: () => {
          return get()
        },
      }
    }),
  ),
)

export { useGlobalConfig }
