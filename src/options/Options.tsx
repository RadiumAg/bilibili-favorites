import React from 'react'
import { useDataContext } from '@/hooks'
import { DataContext } from '@/utils/data-context'
import classNames from 'classnames'
import Tabs from './components/tabs'

const Options: React.FC = () => {
  const dataProvideData = useDataContext()

  return (
    <DataContext.Provider value={dataProvideData}>
      <div
        className={classNames(
          'flex',
          'mt-52',
          'h-[700px]',
          'shadow-xl',
          'mx-auto',
          'rounded-sm',
          'bg-white',
          'min-w-[786px]',
          'max-w-screen-2xl',
        )}
      >
        <Tabs />
      </div>
    </DataContext.Provider>
  )
}

export default Options
