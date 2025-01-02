import React from 'react'

const useSleep = () => {
  const sleepRef = React.useRef<NodeJS.Timeout[]>([])

  return {
    clearAll: () => {
      sleepRef.current.forEach((timer) => {
        clearTimeout(timer)
      })
    },
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
