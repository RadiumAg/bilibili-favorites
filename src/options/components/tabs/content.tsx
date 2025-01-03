import classNames from 'classnames'
import React from 'react'
import { TabProvide } from './provide'

type ContentProps = React.PropsWithChildren<{
  keyValue?: string
}>

const Content: React.FC<ContentProps> = (props) => {
  const { children, keyValue } = props
  const provideData = React.use(TabProvide)

  return (
    <div
      className={classNames('flex-grow h-full', { ['hidden']: keyValue !== provideData.activeKey })}
    >
      {children}
    </div>
  )
}

export default Content
