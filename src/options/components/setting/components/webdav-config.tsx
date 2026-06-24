import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { toast } from '@/hooks/use-toast'
import { type WebDAVConfig } from '@/utils/webdav'
import {
  testConnection,
  uploadSync,
  downloadSync,
  getSyncInfo,
  type SyncStatus,
} from '@/utils/sync-service'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'

export const WebDAVConfigPanel: React.FC = () => {
  const { webdavEnabled, webdavConfig, webdavSyncIndexedDB, webdavLastSyncTime, setGlobalData } =
    useGlobalConfig(
      useShallow((state) => ({
        webdavEnabled: state.webdavEnabled,
        webdavConfig: state.webdavConfig,
        webdavSyncIndexedDB: state.webdavSyncIndexedDB,
        webdavLastSyncTime: state.webdavLastSyncTime,
        setGlobalData: state.setGlobalData,
      })),
    )

  const [serverUrl, setServerUrl] = React.useState(webdavConfig?.serverUrl || '')
  const [username, setUsername] = React.useState(webdavConfig?.username || '')
  const [password, setPassword] = React.useState(webdavConfig?.password || '')
  const [basePath, setBasePath] = React.useState(webdavConfig?.basePath || '/bilibili-favorites/')
  const [testing, setTesting] = React.useState(false)
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>('idle')

  // 保存配置
  const saveConfig = useMemoizedFn(() => {
    const config: WebDAVConfig = {
      serverUrl: serverUrl.replace(/\/$/, ''),
      username,
      password,
      basePath: basePath || '/bilibili-favorites/',
    }
    setGlobalData({ webdavConfig: config })
    toast({ title: '配置已保存' })
  })

  // 测试连接
  const handleTestConnection = useMemoizedFn(async () => {
    if (!serverUrl || !username || !password) {
      toast({ title: '请填写完整配置', variant: 'destructive' })
      return
    }
    setTesting(true)
    try {
      const config: WebDAVConfig = {
        serverUrl: serverUrl.replace(/\/$/, ''),
        username,
        password,
        basePath: basePath || '/bilibili-favorites/',
      }

      // 动态申请权限
      const urlObj = new URL(serverUrl)
      const origin = `${urlObj.protocol}//${urlObj.host}/*`
      const granted = await chrome.permissions.request({
        origins: [origin],
      })
      if (!granted) {
        toast({
          title: '权限被拒绝',
          description: '需要访问 WebDAV 服务器的权限',
          variant: 'destructive',
        })
        setTesting(false)
        return
      }

      const ok = await testConnection(config)
      if (ok) {
        toast({ title: '连接成功', description: 'WebDAV 服务器连接正常' })
        saveConfig()
      } else {
        toast({
          title: '连接失败',
          description: '请检查服务器地址、用户名和密码',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '连接失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  })

  // 手动上传
  const handleUpload = useMemoizedFn(async () => {
    setSyncStatus('syncing')
    try {
      await uploadSync()
      setSyncStatus('success')
      setGlobalData({ webdavLastSyncTime: Date.now() })
      toast({ title: '上传成功', description: '本地数据已同步到云端' })
    } catch (error) {
      setSyncStatus('error')
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    }
  })

  // 手动下载
  const handleDownload = useMemoizedFn(async () => {
    setSyncStatus('syncing')
    try {
      const result = await downloadSync({ applyToStorage: false })
      setSyncStatus('success')
      if (result.hasNew) {
        setGlobalData({
          webdavApplyingRemote: true,
          ...result.settings,
          webdavLastSyncTime: result.remoteLastModified,
          webdavLocalModifiedTime: result.remoteLastModified,
        })
        setGlobalData({ webdavApplyingRemote: false })
        toast({ title: '下载成功', description: '已从云端同步最新数据' })
      } else {
        toast({ title: '已是最新', description: '本地数据与云端一致' })
      }
    } catch (error) {
      setSyncStatus('error')
      toast({
        title: '下载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    }
  })

  // 切换总开关
  const handleToggleEnabled = useMemoizedFn((checked: boolean) => {
    setGlobalData({ webdavEnabled: checked })
    if (!checked) {
      setSyncStatus('idle')
    }
  })

  const formatTime = (ts?: number) => {
    if (!ts) return '从未同步'
    return new Date(ts).toLocaleString('zh-CN')
  }

  // 页面打开时仅提示云端更新，避免静默覆盖本地修改
  React.useEffect(() => {
    if (!webdavEnabled || !webdavConfig) return
    getSyncInfo()
      .then(({ lastSyncTime, localModifiedTime, remoteLastModified }) => {
        if (remoteLastModified && remoteLastModified > lastSyncTime) {
          const hasLocalChanges = localModifiedTime > lastSyncTime
          toast({
            title: '云端有更新',
            description: hasLocalChanges
              ? '本地和云端都有修改，请手动选择上传或下载。'
              : '点击“从云端下载”可同步最新数据。',
          })
        }
      })
      .catch((error) => {
        console.warn('[WebDAV] Check remote update failed:', error)
      })
  }, [webdavEnabled, webdavConfig])

  return (
    <div className="space-y-4">
      {/* 总开关 */}
      <div className="flex items-center gap-3">
        <Switch id="webdav-enabled" checked={webdavEnabled} onCheckedChange={handleToggleEnabled} />
        <Label
          htmlFor="webdav-enabled"
          className="cursor-pointer text-sm font-medium flex items-center gap-2"
        >
          {webdavEnabled ? (
            <Cloud className="w-4 h-4 text-[#00AEEC]" />
          ) : (
            <CloudOff className="w-4 h-4 text-gray-400" />
          )}
          启用 WebDAV 云同步
        </Label>
      </div>

      {webdavEnabled && (
        <div className="space-y-4 pl-1">
          {/* 服务器配置 */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="webdav-url" className="text-xs text-gray-600">
                服务器地址
              </Label>
              <Input
                id="webdav-url"
                placeholder="https://your-server.com/dav/"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="webdav-user" className="text-xs text-gray-600">
                  用户名
                </Label>
                <Input
                  id="webdav-user"
                  placeholder="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="webdav-pass" className="text-xs text-gray-600">
                  密码
                </Label>
                <Input
                  id="webdav-pass"
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="webdav-path" className="text-xs text-gray-600">
                同步路径
              </Label>
              <Input
                id="webdav-path"
                placeholder="/bilibili-favorites/"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              {testing ? '测试中...' : '测试连接并保存'}
            </Button>
          </div>

          {/* 同步选项 */}
          <div className="flex items-center gap-3">
            <Switch
              id="webdav-sync-indexeddb"
              checked={webdavSyncIndexedDB}
              onCheckedChange={(checked) => setGlobalData({ webdavSyncIndexedDB: checked })}
            />
            <Label htmlFor="webdav-sync-indexeddb" className="cursor-pointer text-sm">
              同步分析缓存数据（较大，可选）
            </Label>
          </div>

          {/* 同步状态 & 操作 */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">最近同步</span>
              <span className="flex items-center gap-1.5">
                {syncStatus === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                )}
                {syncStatus === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                {syncStatus === 'syncing' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00AEEC]" />
                )}
                <span className="text-gray-700">{formatTime(webdavLastSyncTime)}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpload}
                disabled={syncStatus === 'syncing' || !webdavConfig}
              >
                <Upload className="w-4 h-4 mr-1" />
                上传到云端
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={syncStatus === 'syncing' || !webdavConfig}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    从云端下载
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认从云端下载？</AlertDialogTitle>
                    <AlertDialogDescription>
                      这会覆盖本地的同步数据，包括配置、默认收藏夹、桌宠开关和标签规则。
                      已下载的数据会立即写入当前页面状态。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDownload}>确认下载</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            同步范围内的数据变更后将自动上传至 WebDAV
            服务器；打开设置页时仅提示云端更新，不会静默覆盖本地数据。支持 Nextcloud、坚果云、群晖等
            WebDAV 服务。
          </p>
        </div>
      )}
    </div>
  )
}
