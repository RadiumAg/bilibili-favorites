import React from 'react'

const useEditKeyword = () => {
  const [keyData, setKeyData] = React.useState<string[]>([])

  const tagElementArray = React.useMemo(() => {
    return keyData.map((keyValue) => {
      return (
        <span contentEditable={false} key={keyValue} className="text-white bg-slate-400 p-1">
          {keyValue}
        </span>
      )
    })
  }, [keyData])

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

  return { keyData, tagElementArray, handleKeyDown }
}

export { useEditKeyword }
