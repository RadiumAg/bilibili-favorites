import React from 'react'
import './Popup.css'
import FavoriteTag from './components/favorite-tag'

export const Popup = () => {
  return (
    <main className="dark:bg-black min-w-96 min-h-96 p-3">
      <h3 className="text-sm dark:text-cyan-50 font-bold">收藏夹</h3>
      <div>
        <React.Suspense fallback={1212}>
          <FavoriteTag />
        </React.Suspense>
      </div>
    </main>
  )
}

export default Popup
