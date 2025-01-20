import React from 'react'

/**
 * this hook to check is strict mode second run
 * @returns
 */
const useIsFirstRun = () => {
  const currentStateRef = React.useRef(true)

  const isFirstRun = {
    get current() {
      const currentState = currentStateRef.current
      currentStateRef.current = false

      return currentState
    },
  }

  React.useEffect(() => {
    return () => {
      currentStateRef.current = true
    }
  }, [])

  return isFirstRun
}

export { useIsFirstRun }
