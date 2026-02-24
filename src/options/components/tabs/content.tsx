import classNames from 'classnames'
import React from 'react'
import { TabProvide } from './provide'

type ContentProps = React.PropsWithChildren<{
  keyValue?: string
}>

const Content: React.FC<ContentProps> = (props) => {
  const { children, keyValue } = props
  const provideData = React.use(TabProvide)

  // if (keyValue !== provideData.activeKey) return null

  return (
    <div
      className={classNames('flex-grow h-full')}
      style={{ display: keyValue === provideData.activeKey ? 'block' : 'none' }}
    >
      {children}
    </div>
  )
}

export default Content
