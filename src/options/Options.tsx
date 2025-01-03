import React, { Suspense } from 'react'
import { useDataContext } from '@/hooks'
import classNames from 'classnames'
import TabWrapper from './components/tabs'
import { DataContext } from '@/utils/data-context'
import { FavoriteTag, Keyword } from '@/components'
import { getAllFavoriteFlag } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
          'mt-52',
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
                <Button>go!</Button>
              </div>

              <div className="flex gap-x-2 h-[90%]">
                <div className="w-1/2 h-full">
                  <Suspense fallback={<></>}>
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
