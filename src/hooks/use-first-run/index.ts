import React from 'react'

/**
 * this hook to check is strict mode first run
 *
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
      // strict mode will run twice, when the second run, we need restore the value
      currentStateRef.current = true
    }
  }, [])

  return isFirstRun
}

export { useIsFirstRun }
