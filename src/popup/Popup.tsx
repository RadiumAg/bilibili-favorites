import React from 'react'
import './Popup.css'
import FavoriteTag from './components/favorite-tag'
import { getAllFavoriteFlag } from './utils/api'
import Keyword from './components/keyword'
import { DataContext, DataContextType } from './utils/data-context'
import { Skeleton } from '@/components/ui/skeleton'

export const Popup = () => {
  const [favoriteTagData, setFavoriteTagData] = React.useState<Omit<DataContextType, 'dispatch'>>({
    favoriteData: [],
    activeKey: undefined,
  })
  const favoriteFlagFetchPromise = React.useMemo(() => getAllFavoriteFlag(), [])

  return (
    <DataContext.Provider value={{ ...favoriteTagData, dispatch: setFavoriteTagData }}>
      <main className="dark:bg-black w-96 min-h-96 p-3">
        <h3 className="text-lg dark:text-cyan-50 font-bold mb-2">收藏夹</h3>

        <React.Suspense fallback={<Skeleton className="w-full h-[200px]" />}>
          <FavoriteTag fetchPromise={favoriteFlagFetchPromise} />
        </React.Suspense>

        <h3 className="text-lg dark:text-cyan-50 font-bold mt-2 mb-2">关键字</h3>
        <Keyword />
      </main>
    </DataContext.Provider>
  )
}

export default Popup
