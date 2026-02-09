import { useMemoizedFn } from 'ahooks'

const useSleep = () => {
  const sleep = useMemoizedFn((ms: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })
  })

  return { sleep }
}

export { useSleep }
