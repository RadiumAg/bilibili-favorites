type AIMoveStatus = 'pending' | 'success' | 'failed' | 'skipped'

type AIMoveResult = {
  status: AIMoveStatus
  targetFavoriteId: number
  videoId: number
  videoTitle: string
  reason: string
  isFallback?: boolean
}

type FavoriteOption = {
  id: number
  title: string
}

export type { AIMoveResult, AIMoveStatus, FavoriteOption }
