import React from 'react'
import { TabProvide } from './provide'
import { cn } from '@/lib/utils'
import { setSearchParams } from '@/utils/search-params'
import { useMount } from 'ahooks'

type TabProps = React.PropsWithChildren<{
  title: string
  keyValue: string
  defaultTab?: boolean
}>

const Tab: React.FC<TabProps> = (props) => {
  const { title, keyValue, defaultTab } = props
  const tabProvideData = React.use(TabProvide)

  const handleClick = () => {
    if (tabProvideData.activeKey === keyValue) {
      return
    } else {
      tabProvideData.dispatch?.((oldData) => {
        return {
          ...oldData,
          activeKey: keyValue,
        }
      })
      setSearchParams({ tab: keyValue })
    }
  }

  useMount(() => {
    if (defaultTab) {
      tabProvideData.dispatch?.((oldValue) => {
        return {
          ...oldValue,
          activeKey: keyValue,
        }
      })
    }
  })

  return (
    <div
      className={cn(
        'text-lg',
        'px-3',
        'py-2',
        'text-center',
        'font-bold',
        'text-b-primary',
        'cursor-pointer',
        'select-none',
        'rounded-lg',
        'transition-all',
        'duration-200',
        {
          'bg-b-primary text-white shadow-sm shadow-b-primary/30':
            tabProvideData.activeKey === keyValue,
          'hover:bg-b-primary/10': tabProvideData.activeKey !== keyValue,
        },
      )}
      role="tab"
      aria-selected={tabProvideData.activeKey === keyValue}
      aria-label={title}
      tabIndex={0}
      onClick={handleClick}
    >
      {title}
    </div>
  )
}

export default Tab
export type { TabProps }
