import React from 'react'
import './Popup.css'
import FavoriteTag from './components/favorite-tag'
import { getAllFavoriteFlag } from './utils/api'
import Keyword from './components/keyword'
import { DataContext } from './utils/data-context'
import { Skeleton } from '@/components/ui/skeleton'
import { useDataContext } from './hooks'

export const Popup = () => {
  const favoriteFlagFetchPromise = React.useMemo(() => getAllFavoriteFlag(), [])
  const dataProvideData = useDataContext()

  return (
    <DataContext.Provider value={dataProvideData}>
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
