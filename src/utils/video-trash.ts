import { dbManager, type VideoTrashRecord } from './indexed-db'
import { requestVideoTrashWebDAVSync } from './sync-service'

const VIDEO_TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

type TrashableVideo = {
  id: number
  title: string
  cover?: string
  bvid?: string
}

const createVideoTrashRecords = (
  videos: TrashableVideo[],
  folder: { id: number; title: string },
  now = Date.now(),
): VideoTrashRecord[] => {
  return videos.map((video) => ({
    key: `${folder.id}:${video.id}:${now}`,
    videoId: video.id,
    title: video.title,
    cover: video.cover,
    bvid: video.bvid,
    originalFolderId: folder.id,
    originalFolderTitle: folder.title,
    deletedAt: now,
    expiresAt: now + VIDEO_TRASH_RETENTION_MS,
  }))
}

const getVideoTrashRemainingDays = (record: VideoTrashRecord, now = Date.now()): number => {
  return Math.max(0, Math.ceil((record.expiresAt - now) / (24 * 60 * 60 * 1000)))
}

const getVideoTrash = (): Promise<VideoTrashRecord[]> => dbManager.getVideoTrash()

const saveVideoTrash = async (records: VideoTrashRecord[]): Promise<void> => {
  if (records.length === 0) return
  await dbManager.putVideoTrash(records)
  await requestVideoTrashWebDAVSync()
}

const removeVideoTrash = async (keys: string[]): Promise<void> => {
  if (keys.length === 0) return
  await dbManager.deleteVideoTrash(keys)
  await requestVideoTrashWebDAVSync()
}

export {
  VIDEO_TRASH_RETENTION_MS,
  createVideoTrashRecords,
  getVideoTrash,
  getVideoTrashRemainingDays,
  removeVideoTrash,
  saveVideoTrash,
}
export type { VideoTrashRecord }
