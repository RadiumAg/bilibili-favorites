import React from 'react'

const useComponentMountState = () => {
  const [mountState, setMountState] = React.useState(() => true)

  React.useEffect(() => {
    setMountState(false)

    return () => {
      setMountState(true)
    }
  }, [])

  return mountState
}

export { useComponentMountState }
