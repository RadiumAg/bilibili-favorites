import { FavoriteMedia } from './api'

type BatchOptions = {
  maxSize: number // 最大处理数量
  processCallback: (videos: FavoriteMedia[]) => Promise<void> | void
}

/**
 * 分批处理函数
 * @param videos
 * @param batchOptions
 */
export const batchProcess = async (videos: FavoriteMedia[], batchOptions: BatchOptions) => {
  if (videos.length === 0) return
  const length = videos.length
  let index = 0

  while (index <= length - 1) {
    const processVideos = videos.slice(index, index + batchOptions.maxSize)
    await batchOptions.processCallback(processVideos)
    index += batchOptions.maxSize
  }
}
