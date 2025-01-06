import React, { Suspense } from 'react'
import { useDataContext } from '@/hooks'
import classNames from 'classnames'
import TabWrapper from './components/tabs'
import { DataContext } from '@/utils/data-context'
import { FavoriteTag, Keyword } from '@/components'
import { getAllFavoriteFlag } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { useCreateKeywordByAi } from '@/hooks/use-create-keyword-by-ai'

const Options: React.FC = () => {
  const { handleCreate } = useCreateKeywordByAi()
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
                <Button className="mr-2" onClick={handleCreate.bind(null, 'all')} size="sm">
                  为所有创建
                </Button>

                <Button onClick={handleCreate.bind(null, 'select')} size="sm">
                  为选中创建
                </Button>
              </div>

              <div className="flex gap-x-2 h-[90%]">
                <div className="w-1/2 h-full">
                  <Suspense fallback={<img src="" />}>
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
