import React from 'react'
import classNames from 'classnames'
import TabWrapper from './components/tabs'
import { FavoriteTag, Keyword } from '@/components'
import OperateButton from './components/create-keyword/operate-button'
import Setting from './components/setting'
import { OptionsAnalysisTab } from './components/analysis'
import { LoginCheck } from '@/popup/components'
import { useSearchParams } from '@/utils/search-params'

const Options: React.FC = () => {
  const searchParams = useSearchParams()

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
        'relative',
        'max-w-screen-2xl',
      )}
    >
      <TabWrapper>
        <TabWrapper.Tab
          title="配置"
          keyValue="setting"
          defaultTab={searchParams.get('tab') === 'setting'}
        >
          <TabWrapper.Content>
            <Setting />
          </TabWrapper.Content>
        </TabWrapper.Tab>

        <TabWrapper.Tab
          title="关键字管理"
          keyValue="keyword-manager"
          defaultTab={searchParams.get('tab') === 'keyword-manager' || !searchParams.get('tab')}
        >
          <TabWrapper.Content>
            <div className="mb-2 flex items-center">
              <OperateButton />
            </div>

            <div className="flex gap-x-2 h-[700px]">
              <div className="w-1/2 h-full">
                <FavoriteTag className="h-full" />
              </div>

              <div className="w-1/2 h-full">
                <Keyword className="h-full" />
              </div>
            </div>
          </TabWrapper.Content>
        </TabWrapper.Tab>

        <TabWrapper.Tab
          title="收藏夹数据分析"
          keyValue="analysis"
          defaultTab={searchParams.get('tab') === 'analysis'}
        >
          <TabWrapper.Content destroyOnHide>
            <OptionsAnalysisTab />
          </TabWrapper.Content>
        </TabWrapper.Tab>
      </TabWrapper>

      <LoginCheck popup={false} />
    </div>
  )
}

export default Options
