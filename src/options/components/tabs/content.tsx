import { cn } from '@/lib/utils'
import React from 'react'
import { TabProvide } from './provide'

type ContentProps = React.PropsWithChildren<{
  keyValue?: string
  destroyOnHide?: boolean
}>

const Content: React.FC<ContentProps> = (props) => {
  const { children, keyValue, destroyOnHide = false } = props
  const provideData = React.use(TabProvide)

  if (destroyOnHide && keyValue !== provideData.activeKey) return null

  return (
    <div
      className={cn('flex-grow h-full')}
      style={{ display: keyValue === provideData.activeKey ? 'block' : 'none' }}
    >
      {children}
    </div>
  )
}

export default Content
