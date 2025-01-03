import React, { Suspense } from 'react'
import { useDataContext } from '@/hooks'
import { DataContext } from '@/utils/data-context'
import classNames from 'classnames'
import Tabs from './components/tabs'
import { FavoriteTag } from '@/popup/components'
import { getAllFavoriteFlag } from '@/utils/api'

const Options: React.FC = () => {
  const dataProvideData = useDataContext()

  const favoriteFlagFetchPromise = React.useMemo(() => {
    return Promise.resolve({ data: { list: dataProvideData.favoriteData } })
  }, [dataProvideData.cookie])

  return (
    <DataContext.Provider value={dataProvideData}>
      <div
        className={classNames(
          'flex',
          'mt-52',
          'h-[700px]',
          'shadow-xl',
          'mx-auto',
          'rounded-sm',
          'bg-white',
          'min-w-[786px]',
          'max-w-screen-2xl',
        )}
      >
        <Tabs>
          <Tabs.Tab title="关键字管理" keyValue="keyword-manager" defaultTab>
            <Tabs.Content>
              <Suspense fallback={11}>
                <FavoriteTag fetchPromise={favoriteFlagFetchPromise}></FavoriteTag>
              </Suspense>
            </Tabs.Content>
          </Tabs.Tab>
        </Tabs>
      </div>
    </DataContext.Provider>
  )
}

export default Options
