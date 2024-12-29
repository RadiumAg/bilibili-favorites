import React from 'react'
import './Popup.css'
import FavoriteTag from './components/favorite-tag'
import { getAllFavoriteFlag } from './utils/api'

export const Popup = () => {
  const favoriteFlagFetchPromise = getAllFavoriteFlag()

  return (
    <main className="dark:bg-black min-w-96 min-h-96 p-3">
      <h3 className="text-lg dark:text-cyan-50 font-bold">收藏夹</h3>

      <div>
        <React.Suspense fallback={null}>
          <FavoriteTag fetchPromise={favoriteFlagFetchPromise} />
        </React.Suspense>
      </div>

      <h3 className="text-lg dark:text-cyan-50 font-bold mt-2">关键字</h3>
    </main>
  )
}

export default Popup
