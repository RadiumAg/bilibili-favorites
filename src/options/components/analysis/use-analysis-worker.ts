import React from 'react'
import { useMemoizedFn } from 'ahooks'

export type WorkerMessage = {
  type: string
  data: any
}

type UseAnalysisWorkerProps = {
  onMessage: (type: string, data: any) => void
}

type UseAnalysisWorkerReturn = {
  postMessage: (message: WorkerMessage) => void
  isReady: boolean
}

/**
 * 管理 Web Worker 的生命周期和通信
 */
export const useAnalysisWorker = (props: UseAnalysisWorkerProps): UseAnalysisWorkerReturn => {
  const { onMessage } = props
  const workerRef = React.useRef<Worker | null>(null)
  const isReadyRef = React.useRef(false)

  // 发送消息到 Worker
  const postMessage = useMemoizedFn((message: WorkerMessage) => {
    if (workerRef.current && isReadyRef.current) {
      workerRef.current.postMessage(message)
    } else {
      console.warn('[useAnalysisWorker] Worker not ready')
    }
  })

  React.useEffect(() => {
    if (typeof Worker !== 'undefined') {
      // 初始化 Worker
      workerRef.current = new Worker(new URL('../../workers/analysis.worker.ts', import.meta.url), {
        type: 'module',
      })

      // 监听 Worker 消息
      workerRef.current.onmessage = (event: MessageEvent) => {
        const { type, data } = event.data

        if (data.error) {
          console.error('[useAnalysisWorker] Worker error:', data.error)
          return
        }

        onMessage(type, data)
      }

      // Worker 准备就绪
      isReadyRef.current = true

      // 清理函数
      return () => {
        workerRef.current?.terminate()
        workerRef.current = null
        isReadyRef.current = false
      }
    }
  }, [onMessage])

  return {
    postMessage,
    isReady: isReadyRef.current,
  }
}
