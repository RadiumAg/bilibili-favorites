import { useDataContext } from '@/hooks'
import { DataContext } from '@/utils/data-context'
import React from 'react'

const Options: React.FC = () => {
  const dataProvideData = useDataContext()

  return (
    <DataContext.Provider value={dataProvideData}>
      <div className="min-w-[786px] min-h-96 shadow-2xl max-w-screen-2xl mx-auto mt-52 bg-white rounded-sm"></div>
    </DataContext.Provider>
  )
}

export default Options
