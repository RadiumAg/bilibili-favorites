import { DataContextType } from '@/utils/data-context'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { chormeStorageMiddleware } from './chorme-storage-middleware'

const useGlobalConfig = create<DataContextType>()(
  immer(
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
  ),
)

export { useGlobalConfig }
