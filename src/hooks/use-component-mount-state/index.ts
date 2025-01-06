import React from 'react'

const useComponentMountState = () => {
  const mountState = React.useRef(true)
  console.log('mountState', mountState.current)

  mountState.current = false

  React.useEffect(() => {
    mountState.current = true

    return () => {
      mountState.current = false
    }
  }, [])

  return mountState
}

export { useComponentMountState }
