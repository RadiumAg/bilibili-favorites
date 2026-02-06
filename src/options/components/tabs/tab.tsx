import React from 'react'
import { TabProvide } from './provide'
import classNames from 'classnames'

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
      tabProvideData.dispatch?.((oldData) => {
        return {
          ...oldData,
          activeKey: undefined,
        }
      })
    } else {
      tabProvideData.dispatch?.((oldData) => {
        return {
          ...oldData,
          activeKey: keyValue,
        }
      })
    }
  }

  React.useEffect(() => {
    if (defaultTab) {
      tabProvideData.dispatch?.((oldValue) => {
        return {
          ...oldValue,
          activeKey: keyValue,
        }
      })
    }
  }, [])

  return (
    <div
      onClick={handleClick}
      className={classNames(
        'text-lg',
        'px-2',
        'py-1',
        'text-center',
        'font-bold',
        ' text-b-primary',
        'cursor-pointer',
        'select-none',
        'rounded-sm',
        {
          ['bg-b-primary bg-opacity-25']: tabProvideData.activeKey === keyValue,
        },
      )}
    >
      {title}
    </div>
  )
}

export default Tab
export type { TabProps }
