import React, { Suspense } from 'react'
import classNames from 'classnames'
import TabWrapper from './components/tabs'
import { FavoriteTag, Keyword } from '@/components'
import { getAllFavoriteFlag } from '@/utils/api'
import OperateButton from './components/create-keyword/operate-button'
import { Skeleton } from '@/components/ui/skeleton'
import Setting from './components/setting'
import { OptionsAnalysisTab } from '@/components/analysis'
import { useGlobalConfig } from '@/store/global-data'

const Options: React.FC = () => {
  const dataProvideData = useGlobalConfig()

  const favoriteFlagFetchPromise = React.useMemo(() => {
    return getAllFavoriteFlag(dataProvideData.cookie)
  }, [dataProvideData.cookie])

  return (
    <div
      className={classNames(
        'flex',
        'mt-[5%]',
        'shadow-xl',
        'min-h-[700px]',
        'mx-auto',
        'flex-col',
        'rounded-sm',
        'bg-white',
        'min-w-[786px]',
        'max-w-screen-2xl',
      )}
    >
      <TabWrapper>
        <TabWrapper.Tab title="配置" keyValue="setting" defaultTab>
          <TabWrapper.Content>
            <Setting></Setting>
          </TabWrapper.Content>
        </TabWrapper.Tab>

        <TabWrapper.Tab title="关键字管理" keyValue="keyword-manager" defaultTab={false}>
          <TabWrapper.Content>
            <div className="mb-2 flex items-center">
              <OperateButton />
            </div>

            <div className="flex gap-x-2 h-[700px]">
              <div className="w-1/2 h-full">
                <Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <FavoriteTag fetchPromise={favoriteFlagFetchPromise} className="h-full" />
                </Suspense>
              </div>

              <div className="w-1/2 h-full">
                <Keyword className="h-full" />
              </div>
            </div>
          </TabWrapper.Content>
        </TabWrapper.Tab>

        <TabWrapper.Tab title="收藏夹数据分析" keyValue="analysis" defaultTab={false}>
          <TabWrapper.Content>
            <OptionsAnalysisTab />
          </TabWrapper.Content>
        </TabWrapper.Tab>
      </TabWrapper>
    </div>
  )
}

export default Options
