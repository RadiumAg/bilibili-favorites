import React from 'react'

type TabProvideType = {
  activeKey: string | undefined
  dispatch: React.Dispatch<React.SetStateAction<Omit<TabProvideType, 'dispatch'>>> | undefined
}

const TabProvide = React.createContext<TabProvideType>({
  activeKey: undefined,
  dispatch: undefined,
})

export { TabProvide }
export type { TabProvideType }
