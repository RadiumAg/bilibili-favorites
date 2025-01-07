import React, { Suspense } from 'react'
import { useDataContext } from '@/hooks'
import classNames from 'classnames'
import TabWrapper from './components/tabs'
import { DataContext } from '@/utils/data-context'
import { FavoriteTag, Keyword } from '@/components'
import { getAllFavoriteFlag } from '@/utils/api'
import OperateButton from './components/create-keyword/operate-button'

import loadingImg from '@/assets/loading.gif'
import { Skeleton } from '@/components/ui/skeleton'

const Options: React.FC = () => {
  const dataProvideData = useDataContext()

  const favoriteFlagFetchPromise = React.useMemo(() => {
    return getAllFavoriteFlag(dataProvideData.cookie)
  }, [dataProvideData.cookie])

  return (
    <DataContext.Provider value={dataProvideData}>
      <div
        className={classNames(
          'flex',
          'mt-[5%]',
          'h-[700px]',
          'shadow-xl',
          'mx-auto',
          'flex-col',
          'rounded-sm',
          'bg-white',
          'min-w-[786px]',
          'max-w-screen-2xl',
        )}
      >
        <TabWrapper>
          <TabWrapper.Tab title="关键字管理" keyValue="keyword-manager" defaultTab>
            <TabWrapper.Content>
              <div className="mb-2 flex items-center">
                <OperateButton />
              </div>

              <div className="flex gap-x-2 h-[90%]">
                <div className="w-1/2 h-full">
                  <Suspense fallback={<Skeleton className="w-full h-full" />}>
                    <FavoriteTag fetchPromise={favoriteFlagFetchPromise} />
                  </Suspense>
                </div>

                <div className="w-1/2 h-full">
                  <Keyword className="h-full" />
                </div>
              </div>
            </TabWrapper.Content>
          </TabWrapper.Tab>
        </TabWrapper>
      </div>
    </DataContext.Provider>
  )
}

export default Options
