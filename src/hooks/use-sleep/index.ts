import React from 'react'

const useSleep = () => {
  const sleepRef = React.useRef<NodeJS.Timeout[]>([])

  const clearAll = () => {
    sleepRef.current.forEach((timer) => {
      clearTimeout(timer)
    })
  }

  React.useEffect(() => {
    return clearAll
  }, [])

  return {
    clearAll: clearAll,
    sleep: (time: number) => {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve(undefined)
        }, time)

        sleepRef.current.push(timer)
      })
    },
  }
}

export { useSleep }
