import React from 'react'
import Tab from './tab'
import { TabProvide, TabProvideType } from './provide'
import Content from './content'

type TabsProps = React.PropsWithChildren<{}>

const Tabs: React.FC<TabsProps> & { Content: typeof Content } = (props) => {
  const [provideState, setProvideState] = React.useState<Omit<TabProvideType, 'dispatch'>>({
    activeKey: undefined,
  })

  const provideData = React.useMemo<TabProvideType>(() => {
    return {
      ...provideState,
      dispatch: setProvideState,
    }
  }, [...Object.values(provideState)])

  return (
    <TabProvide.Provider value={provideData}>
      <div className="h-full w-full">
        <div className="h-full border-r border-border border-b-primary max-w-40 py-3 px-2">
          <Tab title="生成关键字" keyValue="createKeyword" />
        </div>
      </div>
    </TabProvide.Provider>
  )
}

Tabs.Content = Content
export default Tabs
