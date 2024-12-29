import React from 'react'
import './Popup.css'
import FavoriteTag from './components/favorite-tag'
import { getAllFavoriteFlag } from './utils/api'
import Keyword from './components/keyword'

export const Popup = () => {
  const favoriteFlagFetchPromise = getAllFavoriteFlag()

  return (
    <main className="dark:bg-black w-96 min-h-96 p-3 mb-2">
      <h3 className="text-lg dark:text-cyan-50 font-bold">收藏夹</h3>

      <div>
        <React.Suspense fallback={null}>
          <FavoriteTag fetchPromise={favoriteFlagFetchPromise} />
        </React.Suspense>
      </div>

      <h3 className="text-lg dark:text-cyan-50 font-bold mt-2 mb-2">关键字</h3>

      <div>
        <Keyword />
      </div>
    </main>
  )
}

export default Popup
