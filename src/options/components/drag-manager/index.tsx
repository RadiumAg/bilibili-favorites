import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { useToast } from '@/hooks/use-toast'
import classNames from 'classnames'
import { useFavoriteData, useFavoriteListData } from '@/hooks'
import FolderList from './folder-list'
import VideoList from './video-list'
import TrashList from './trash-list'
import { updateSelection } from './selection'
import { sleep } from '@/utils/promise'
import { notifyOrganizeDone } from '@/utils/pet-message'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  createVideoTrashRecords,
  getVideoTrash,
  removeVideoTrash,
  saveVideoTrash,
  type VideoTrashRecord,
} from '@/utils/video-trash'
import { syncVideoTrashWithWebDAV } from '@/utils/sync-service'

interface VideoItem {
  id: number
  title: string
  cover?: string
  bvid?: string
}

const API_PAGE_SIZE = 40
const DELETE_BATCH_SIZE = 100

type FavoriteOperationResponse = {
  code: number
  message?: string
}

interface DragManagerProps {
  className?: string
}

const DragManager: React.FC<DragManagerProps> = ({ className }) => {
  const { toast } = useToast()
  const { favoriteData, refresh: refreshFavData } = useFavoriteData()
  const { fetchPageWithCache, invalidateCache, invalidatePageCache } = useFavoriteListData()

  const [selectedFolderId, setSelectedFolderId] = React.useState<number | null>(null)
  const [videos, setVideos] = React.useState<VideoItem[]>([])
  const [currentPage, setCurrentPage] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [selectedVideoIds, setSelectedVideoIds] = React.useState<Set<number>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [moving, setMoving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [dragOverFolderId, setDragOverFolderId] = React.useState<number | null>(null)
  const [initialized, setInitialized] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'folder' | 'trash'>('folder')
  const [trashRecords, setTrashRecords] = React.useState<VideoTrashRecord[]>([])
  const [trashSelectedKeys, setTrashSelectedKeys] = React.useState<Set<string>>(new Set())
  const [trashLoading, setTrashLoading] = React.useState(false)
  const [trashProcessing, setTrashProcessing] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [permanentDeleteConfirmOpen, setPermanentDeleteConfirmOpen] = React.useState(false)

  // 当前收藏夹元数据（用于显示总数量）
  const selectedFolder = favoriteData.find((f) => f.id === selectedFolderId)
  const totalCount = selectedFolder?.media_count
  const existingFolderIds = React.useMemo(
    () => new Set(favoriteData.map((folder) => folder.id)),
    [favoriteData],
  )

  const loadTrash = useMemoizedFn(async (syncRemote = false) => {
    setTrashLoading(true)

    if (syncRemote) {
      try {
        await syncVideoTrashWithWebDAV()
      } catch (error) {
        console.warn('Sync video trash from WebDAV failed:', error)
        toast({
          title: '云端回收站同步失败',
          description: '已继续显示本地回收站记录',
          variant: 'destructive',
        })
      }
    }

    try {
      const records = await getVideoTrash()
      setTrashRecords(records)
      setTrashSelectedKeys(new Set())
    } catch (error) {
      toast({
        title: '回收站加载失败',
        description: error instanceof Error ? error.message : '读取回收站失败',
        variant: 'destructive',
      })
    } finally {
      setTrashLoading(false)
    }
  })

  // 加载收藏夹视频（仅加载第 1 页，即时响应）
  const loadVideos = useMemoizedFn(async (folderId: number) => {
    setLoading(true)
    setSelectedVideoIds(new Set())
    setVideos([])
    try {
      const { medias, hasMore: more } = await fetchPageWithCache(
        folderId.toString(),
        1,
        API_PAGE_SIZE,
      )
      setVideos(medias.map((m) => ({ id: m.id, title: m.title, cover: m.cover, bvid: m.bvid })))
      setCurrentPage(1)
      setHasMore(more)
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '获取视频列表失败',
        variant: 'destructive',
      })
      setVideos([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  })

  // 加载下一页
  const handleLoadMore = useMemoizedFn(async () => {
    if (loadingMore || !hasMore || selectedFolderId === null) return
    setLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const { medias, hasMore: more } = await fetchPageWithCache(
        selectedFolderId.toString(),
        nextPage,
        API_PAGE_SIZE,
      )
      setVideos((prev) => [
        ...prev,
        ...medias.map((m) => ({ id: m.id, title: m.title, cover: m.cover, bvid: m.bvid })),
      ])
      setCurrentPage(nextPage)
      setHasMore(more)
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '获取视频列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoadingMore(false)
    }
  })

  // 选择收藏夹
  const handleSelectFolder = useMemoizedFn((folderId: number) => {
    setViewMode('folder')
    setSelectedFolderId(folderId)
    loadVideos(folderId)
  })

  const handleSelectTrash = useMemoizedFn(() => {
    setViewMode('trash')
    setSelectedVideoIds(new Set())
    loadTrash(true)
  })

  // 切换视频选中状态
  const toggleVideoSelection = useMemoizedFn((videoId: number) => {
    setSelectedVideoIds((previous) => updateSelection(previous, videoId))
  })

  const toggleVideoChecked = useMemoizedFn((videoId: number, checked: boolean) => {
    setSelectedVideoIds((previous) => updateSelection(previous, videoId, checked))
  })

  const clearVideoSelection = useMemoizedFn(() => {
    setSelectedVideoIds(new Set())
  })

  // 全选/取消全选（基于已加载的视频）
  const toggleSelectAll = useMemoizedFn(() => {
    if (selectedVideoIds.size === videos.length) {
      setSelectedVideoIds(new Set())
    } else {
      setSelectedVideoIds(new Set(videos.map((v) => v.id)))
    }
  })

  const toggleTrashSelection = useMemoizedFn((key: string, checked: boolean) => {
    setTrashSelectedKeys((previous) => updateSelection(previous, key, checked))
  })

  const toggleSelectAllTrash = useMemoizedFn(() => {
    if (trashSelectedKeys.size === trashRecords.length) {
      setTrashSelectedKeys(new Set())
    } else {
      setTrashSelectedKeys(new Set(trashRecords.map((record) => record.key)))
    }
  })

  const clearTrashSelection = useMemoizedFn(() => {
    setTrashSelectedKeys(new Set())
  })

  // 拖拽开始
  const handleDragStart = useMemoizedFn((event: React.DragEvent, videoId: number) => {
    const dragIds = selectedVideoIds.has(videoId) ? Array.from(selectedVideoIds) : [videoId]
    event.dataTransfer.setData('application/json', JSON.stringify(dragIds))
    event.dataTransfer.effectAllowed = 'move'

    const dragImage = document.createElement('div')
    dragImage.className = 'bg-b-primary text-white px-3 py-2 rounded shadow-lg'
    dragImage.textContent = `移动 ${dragIds.length} 个视频`
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  })

  // 拖拽经过收藏夹
  const handleDragOver = useMemoizedFn((event: React.DragEvent, folderId: number) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  })

  // 拖拽离开收藏夹
  const handleDragLeave = useMemoizedFn(() => {
    setDragOverFolderId(null)
  })

  // 放置到收藏夹
  const handleDrop = useMemoizedFn(async (event: React.DragEvent, targetFolderId: number) => {
    event.preventDefault()
    setDragOverFolderId(null)

    if (selectedFolderId === null || targetFolderId === selectedFolderId) return

    const data = event.dataTransfer.getData('application/json')
    if (!data) return

    const videoIds: number[] = JSON.parse(data)
    if (videoIds.length === 0) return

    setMoving(true)
    let successCount = 0
    let failCount = 0

    for (const videoId of videoIds) {
      try {
        await queryAndSendMessage({
          type: MessageEnum.moveVideo,
          data: { srcMediaId: selectedFolderId, tarMediaId: targetFolderId, videoId },
        })
        successCount++
      } catch (error) {
        failCount++
        console.error('Move failed:', error)
      }
    }

    setMoving(false)
    toast({ title: '移动完成', description: `成功: ${successCount}, 失败: ${failCount}` })

    if (successCount > 0) {
      invalidatePageCache(selectedFolderId.toString())
      invalidatePageCache(targetFolderId.toString())
      loadVideos(selectedFolderId)
      await sleep(1000) // 请求太快favdata会刷新不了
      refreshFavData()
      notifyOrganizeDone(successCount)
    }
  })

  const handleConfirmDelete = useMemoizedFn(async () => {
    if (!selectedFolder || selectedVideoIds.size === 0) return

    const selectedVideos = videos.filter((video) => selectedVideoIds.has(video.id))
    if (selectedVideos.length === 0) return

    const trashCandidates = createVideoTrashRecords(selectedVideos, selectedFolder)
    const recordByVideoId = new Map(
      trashCandidates.map((record) => [record.videoId, record] as const),
    )
    const successIds = new Set<number>()
    const failedIds = new Set<number>()
    setDeleting(true)

    try {
      await saveVideoTrash(trashCandidates)
    } catch (error) {
      setDeleting(false)
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '无法保存回收站记录',
        variant: 'destructive',
      })
      return
    }

    try {
      for (let index = 0; index < selectedVideos.length; index += DELETE_BATCH_SIZE) {
        const batch = selectedVideos.slice(index, index + DELETE_BATCH_SIZE)
        try {
          const response = await queryAndSendMessage<FavoriteOperationResponse>({
            type: MessageEnum.deleteFavoriteVideos,
            data: {
              mediaId: selectedFolder.id,
              videoIds: batch.map((video) => video.id),
            },
          })
          if (response.code !== 0) {
            throw new Error(response.message || '删除视频失败')
          }
          batch.forEach((video) => successIds.add(video.id))
        } catch (error) {
          console.error('Delete favorite videos failed:', error)
          batch.forEach((video) => failedIds.add(video.id))
        }
      }

      const failedTrashKeys = Array.from(failedIds)
        .map((videoId) => recordByVideoId.get(videoId)?.key)
        .filter((key): key is string => Boolean(key))
      try {
        await removeVideoTrash(failedTrashKeys)
      } catch (error) {
        console.error('Remove failed trash snapshots failed:', error)
      }

      if (successIds.size > 0) {
        setVideos((previous) => previous.filter((video) => !successIds.has(video.id)))
        setSelectedVideoIds(new Set())
        invalidateCache(selectedFolder.id.toString())
        invalidatePageCache(selectedFolder.id.toString())
        await loadTrash()
        await sleep(1000)
        refreshFavData()
      }

      toast({
        title: '删除完成',
        description: `已移入回收站 ${successIds.size} 个，失败 ${failedIds.size} 个`,
        variant: failedIds.size > 0 && successIds.size === 0 ? 'destructive' : 'default',
      })
    } finally {
      setDeleting(false)
    }
  })

  const handleRestoreTrash = useMemoizedFn(async () => {
    const selectedRecords = trashRecords.filter((record) => trashSelectedKeys.has(record.key))
    if (selectedRecords.length === 0) return

    const restoredKeys: string[] = []
    let failedCount = 0
    setTrashProcessing(true)

    try {
      for (const record of selectedRecords) {
        if (!existingFolderIds.has(record.originalFolderId)) {
          failedCount++
          continue
        }

        try {
          const response = await queryAndSendMessage<FavoriteOperationResponse>({
            type: MessageEnum.restoreFavoriteVideo,
            data: { mediaId: record.originalFolderId, videoId: record.videoId },
          })
          if (response.code !== 0) {
            throw new Error(response.message || '恢复视频失败')
          }
          restoredKeys.push(record.key)
          invalidateCache(record.originalFolderId.toString())
          invalidatePageCache(record.originalFolderId.toString())
        } catch (error) {
          failedCount++
          console.error('Restore favorite video failed:', error)
        }
      }

      await removeVideoTrash(restoredKeys)
      await loadTrash()
      if (restoredKeys.length > 0) {
        await sleep(1000)
        refreshFavData()
      }
      toast({
        title: '恢复完成',
        description: `成功 ${restoredKeys.length} 个，失败 ${failedCount} 个`,
        variant: failedCount > 0 && restoredKeys.length === 0 ? 'destructive' : 'default',
      })
    } catch (error) {
      toast({
        title: '恢复失败',
        description: error instanceof Error ? error.message : '更新回收站失败',
        variant: 'destructive',
      })
    } finally {
      setTrashProcessing(false)
    }
  })

  const handlePermanentDelete = useMemoizedFn(async () => {
    const keys = Array.from(trashSelectedKeys)
    if (keys.length === 0) return

    setTrashProcessing(true)
    try {
      await removeVideoTrash(keys)
      await loadTrash()
      toast({ title: '已永久删除', description: `已清除 ${keys.length} 条回收站记录` })
    } catch (error) {
      toast({
        title: '清除失败',
        description: error instanceof Error ? error.message : '清除回收站失败',
        variant: 'destructive',
      })
    } finally {
      setTrashProcessing(false)
    }
  })

  const requestDeleteSelected = useMemoizedFn(() => {
    setDeleteConfirmOpen(true)
  })

  const requestPermanentDelete = useMemoizedFn(() => {
    setPermanentDeleteConfirmOpen(true)
  })

  // 默认选中第一个收藏夹
  React.useEffect(() => {
    if (!initialized && favoriteData.length > 0) {
      setInitialized(true)
      handleSelectFolder(favoriteData[0].id)
    }
  }, [favoriteData, handleSelectFolder, initialized])

  React.useEffect(() => {
    loadTrash()
  }, [loadTrash])

  return (
    <>
      <div className={classNames('flex gap-4 h-[500px] md:h-[700px]', className)}>
        <FolderList
          folders={favoriteData}
          selectedFolderId={viewMode === 'folder' ? selectedFolderId : null}
          trashSelected={viewMode === 'trash'}
          trashCount={trashRecords.length}
          dragOverFolderId={dragOverFolderId}
          onSelectFolder={handleSelectFolder}
          onSelectTrash={handleSelectTrash}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
        {viewMode === 'folder' ? (
          <VideoList
            videos={videos}
            totalCount={totalCount}
            selectedVideoIds={selectedVideoIds}
            selectedFolderId={selectedFolderId}
            loading={loading}
            moving={moving}
            deleting={deleting}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onToggleVideo={toggleVideoSelection}
            onCheckedChange={toggleVideoChecked}
            onToggleSelectAll={toggleSelectAll}
            onClearSelection={clearVideoSelection}
            onRequestDelete={requestDeleteSelected}
            onDragStart={handleDragStart}
            onLoadMore={handleLoadMore}
          />
        ) : (
          <TrashList
            records={trashRecords}
            selectedKeys={trashSelectedKeys}
            existingFolderIds={existingFolderIds}
            loading={trashLoading}
            processing={trashProcessing}
            onCheckedChange={toggleTrashSelection}
            onToggleSelectAll={toggleSelectAllTrash}
            onClearSelection={clearTrashSelection}
            onRestore={handleRestoreTrash}
            onRequestPermanentDelete={requestPermanentDelete}
          />
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>删除选中的 {selectedVideoIds.size} 个视频？</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              视频将从「{selectedFolder?.title || '当前收藏夹'}」移除，并在本地回收站保留 7
              天。期间可恢复到原收藏夹。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              删除并移入回收站
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={permanentDeleteConfirmOpen} onOpenChange={setPermanentDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>永久删除 {trashSelectedKeys.size} 条记录？</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              删除后将无法通过回收站恢复，该操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              永久删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DragManager
