import React from 'react'
import './Popup.css'
import FavoriteTag from './components/favorite-tag'
import { getAllFavoriteFlag } from './utils/api'
import Keyword from './components/keyword'
import { DataContext } from './utils/data-context'
import { Skeleton } from '@/components/ui/skeleton'
import { useDataContext } from './hooks'
import Move from './components/move'
import LoginCheck from './components/login-check'
import AutoCreateKeyword from './components/auto-create-keyword'

export const Popup = () => {
  const dataProvideData = useDataContext()

  const favoriteFlagFetchPromise = React.useMemo(
    () => getAllFavoriteFlag(dataProvideData.cookie),
    [dataProvideData.cookie],
  )

  return (
    <DataContext.Provider value={dataProvideData}>
      <main className="w-96 min-h-96 p-3 bg-b-primary bg-opacity-15 flex flex-col">
        <div className="flex-grow">
          <h3 className="text-lg font-bold mb-2 text-b-text-primary flex justify-between">
            收藏夹
          </h3>

          <React.Suspense fallback={<Skeleton className="w-full h-[200px]" />}>
            <FavoriteTag fetchPromise={favoriteFlagFetchPromise} />
          </React.Suspense>

          <h3 className="text-lg font-bold mt-2 mb-2 text-b-text-primary">关键字</h3>
          <Keyword />
        </div>

        <div className="flex items-center mt-2 gap-x-1">
          <Move />
          <AutoCreateKeyword />
        </div>

        <LoginCheck />
      </main>
    </DataContext.Provider>
  )
}

export default Popup
