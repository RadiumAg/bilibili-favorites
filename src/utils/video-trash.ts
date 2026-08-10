import { dbManager, type VideoTrashRecord } from './indexed-db'

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

const saveVideoTrash = (records: VideoTrashRecord[]): Promise<void> => {
  return dbManager.putVideoTrash(records)
}

const removeVideoTrash = (keys: string[]): Promise<void> => {
  return dbManager.deleteVideoTrash(keys)
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
