import { StateCreator } from 'zustand'

const chormeStorageMiddleware: ChormeStorageImpl = (config) => {
  return (set, get, api) => {
    const savedSetState = api.setState

    const hydrate = () => {
      chrome.storage.local
        .get(['keyword', 'activeKey', 'cookie', 'aiConfig', 'defaultFavoriteId'])
        .then((data) => {
          if (data) {
            set(data as any)
            setItem()
          }
        })
    }

    const setItem = () => {
      const state = get()
      chrome.storage.local.set(state as any)
    }

    const configResult = config(
      (...args) => {
        set(...(args as Parameters<typeof set>))
        void setItem()
      },
      get,
      api,
    )

    api.getInitialState = () => {
      return configResult
    }

    api.setState = (state, replace) => {
      savedSetState(state, replace as any)
      setItem()
    }

    hydrate()

    return configResult
  }
}

type ChormeStorageImpl = <T>(storeInitializer: StateCreator<T, [], []>) => StateCreator<T, [], []>

export { chormeStorageMiddleware }
