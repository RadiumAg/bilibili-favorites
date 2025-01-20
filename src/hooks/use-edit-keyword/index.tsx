import React from 'react'
import { v4 as uuid } from 'uuid'
import { DataContext } from '@/utils/data-context'

const useEditKeyword = () => {
  const dataContext = React.use(DataContext)
  const currentFavoriteTag = dataContext['keyword']?.find(
    (key) => key.favoriteDataId === dataContext.activeKey,
  )

  const tagElementArray = React.useMemo(() => {
    return currentFavoriteTag?.value.map((keyValue, index) => {
      return (
        <span
          key={index}
          contentEditable={false}
          className={
            'text-white p-1 cursor-pointer flex items-center relative bg-b-primary rounded-sm'
          }
        >
          {keyValue.value}

          <svg
            onClick={() => {
              handDelete(keyValue.id)
            }}
            className="block size-2 ml-1"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="4257"
          >
            <path
              d="M942.8 73.4c-22-21.6-57.4-21.3-79 0.7L512 432.2 160.3 74.1c-21.6-22-57-22.3-79-0.7s-22.3 57-0.7 79L433.7 512 80.5 871.6c-21.6 22-21.3 57.4 0.7 79s57.4 21.3 79-0.7L512 591.8 863.7 950c21.6 22 57 22.3 79 0.7s22.3-57 0.7-79L590.3 512l353.2-359.6c21.6-22 21.3-57.4-0.7-79z"
              fill="#fff"
              p-id="4258"
            ></path>
          </svg>
        </span>
      )
    })
  }, [dataContext.keyword, dataContext.activeKey])

  const handDelete = (id: string) => {
    dataContext.dispatch?.((oldValue) => {
      const targetKeyword = oldValue.keyword.find(
        (key) => key.favoriteDataId === dataContext.activeKey,
      )

      if (targetKeyword == null) return oldValue

      targetKeyword.value = targetKeyword?.value.filter((fav) => fav.id !== id)
      return { ...oldValue, keyword: [...oldValue.keyword] }
    })
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    const target = event.target as HTMLInputElement
    let inputValue = target.value

    if (event.key === 'Enter') {
      dataContext.dispatch?.((oldValue) => {
        if (inputValue === '') {
          return { ...oldValue, keyword: [...oldValue.keyword] }
        }

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

        targetkeyword.value = [...targetkeyword?.value, { value: inputValue, id: uuid() }]

        inputValue = ''

        return {
          ...oldValue,
          keyword: [...oldValue.keyword],
        }
      })

      target.value = ''
    }
  }

  return { keyData: dataContext.keyword, tagElementArray, handleKeyDown }
}

export { useEditKeyword }
