import React from 'react'
import Tab, { TabProps } from './tab'
import { TabProvide, TabProvideType } from './provide'
import Content from './content'
import { Github } from 'lucide-react'

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
      <div className="h-full w-full flex flex-1">
        <div className="border-r border-border border-b-primary max-w-44 py-3 px-2 shrink-0 flex flex-col">
          <div className="flex-1">{children}</div>
          <a
            href="https://github.com/RadiumAg/bilibili-favorites"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-b-primary transition-colors duration-200 mt-auto"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>

        <div className="p-4 grow h-full relative">{contentElementList}</div>
      </div>
    </TabProvide.Provider>
  )
}

Tabs.Content = Content
Tabs.Tab = Tab

export default Tabs
