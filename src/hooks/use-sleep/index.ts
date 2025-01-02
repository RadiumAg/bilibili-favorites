import React from 'react'

const useSleep = () => {
  const sleepRef = React.useRef<NodeJS.Timeout[]>([])

  React.useEffect(() => {
    return () => {
      debugger
      sleepRef.current.forEach((timer) => {
        clearTimeout(timer)
      })
    }
  }, [])

  return (time: number) => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(undefined)
      }, time)

      sleepRef.current.push(timer)
    })
  }
}

export { useSleep }
