import React from 'react'
import Tab, { TabProps } from './tab'
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

  const contentElementList = React.Children.map(children, (child, index) => {
    const tab = child as React.ReactElement<TabProps>
    const tabChild = tab.props.children

    if (Array.isArray(tabChild)) return
    if (typeof tabChild !== 'object') return
    if (tabChild == null) return

    return React.cloneElement(tabChild as any, {
      key: index,
      keyValue: tab.props.keyValue,
    })
  })

  return (
    <TabProvide.Provider value={provideData}>
      <div className="h-full w-full flex">
        <div className="border-r border-border border-b-primary max-w-40 py-3 px-2 shrink-0">
          {children}
        </div>

        <div className="p-6 grow h-full">{contentElementList}</div>
      </div>
    </TabProvide.Provider>
  )
}

Tabs.Content = Content
Tabs.Tab = Tab

export default Tabs
