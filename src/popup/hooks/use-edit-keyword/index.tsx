import React from 'react'
import { DataContext } from '../../utils/data-context'
import classNames from 'classnames'

const useEditKeyword = () => {
  const dataContext = React.use(DataContext)
  const currentFavoriteTag = dataContext['keyword'].find(
    (key) => key.favoriteDataId === dataContext.activeKey,
  )

  const tagElementArray = React.useMemo(() => {
    return currentFavoriteTag?.value.map((keyValue, index) => {
      return (
        <span
          key={index}
          contentEditable={false}
          className={classNames('dark:text-white bg-slate-400 p-1')}
        >
          {keyValue}
        </span>
      )
    })
  }, [dataContext.keyword, dataContext.activeKey])

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    const target = event.target as HTMLInputElement
    const inputValue = target.value

    if (event.key === 'Enter') {
      dataContext.dispatch?.((oldValue) => {
        if (inputValue === '') return oldValue

        console.log('inputValue', inputValue)

        let targetkeyword = oldValue.keyword.find(
          (key) => key.favoriteDataId === dataContext.activeKey,
        )
        if (dataContext.activeKey == null) return oldValue
        if (targetkeyword == null) {
          targetkeyword = {
            value: [],
            favoriteDataId: dataContext.activeKey,
          }
          dataContext.keyword.push(targetkeyword)
        }

        targetkeyword.value = [...targetkeyword?.value, inputValue]

        return {
          ...oldValue,
          keyword: [...dataContext.keyword],
        }
      })

      target.value = ''
    }
  }

  return { keyData: dataContext.keyword, tagElementArray, handleKeyDown }
}

export { useEditKeyword }
