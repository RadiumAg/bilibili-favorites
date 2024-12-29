import React from 'react'
import { DataContext } from '../../utils/data-context'
import classNames from 'classnames'

const useEditKeyword = () => {
  const [keyData, setKeyData] = React.useState<string[]>([])
  const dataContext = React.use(DataContext)

  const tagElementArray = React.useMemo(() => {
    return keyData.map((keyValue) => {
      return (
        <span
          contentEditable={false}
          key={keyValue}
          className={classNames('text-white bg-slate-400 p-1')}
        >
          {keyValue}
        </span>
      )
    })
  }, [keyData, dataContext.activeKey])

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    const target = event.target as HTMLInputElement

    if (event.key === 'Enter') {
      const inputValue = target.value
      if (inputValue === '') return

      setKeyData((oldValue) => {
        const newValue = [...oldValue, inputValue]
        return newValue
      })

      target.value = ''
    }
  }

  console.log(dataContext.activeKey)

  return { keyData, tagElementArray, handleKeyDown }
}

export { useEditKeyword }
