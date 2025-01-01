import React, { Children } from 'react'
import Tab from './tab'
import { TabProvide, TabProvideType } from './provide'
import Content from './content'

type TabsProps = React.PropsWithChildren<{}>

const Tabs: React.FC<TabsProps> & { Content: typeof Content; Tab: typeof Tab } = (props) => {
  const { children } = props
  const [provideState, setProvideState] = React.useState<Omit<TabProvideType, 'dispatch'>>({
    activeKey: undefined,
  })

  const provideData = React.useMemo<TabProvideType>(() => {
    return {
      ...provideState,
      dispatch: setProvideState,
    }
  }, [...Object.values(provideState)])

  const contentElementList = React.Children.map(children, (child) => {
    const tabChild = (child as React.ReactElement<TabsProps>).props.children

    if (tabChild == null || Array.isArray(tabChild) || typeof tabChild !== 'object' || tabChild)
      return null

    React.cloneElement(tabChild, {
      activeKey: provideData.activeKey,
    })
  })

  return (
    <TabProvide.Provider value={provideData}>
      <div className="h-full w-full flex">
        <div className="h-full border-r border-border border-b-primary max-w-40 py-3 px-2">
          {children}
        </div>

        <div className="p-4">{contentElementList}</div>
      </div>
    </TabProvide.Provider>
  )
}

Tabs.Content = Content
Tabs.Tab = Tab

export default Tabs
