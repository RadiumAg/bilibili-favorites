/**
 * 轻量 WebDAV 客户端（基于 fetch，通过 background service worker 中转）
 */

export type WebDAVConfig = {
  serverUrl: string // e.g. https://dav.example.com/remote.php/dav/files/user
  username: string
  password: string
  basePath?: string // 默认 /bilibili-favorites/
}

export type WebDAVRequestOptions = {
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
}

export type WebDAVResponse = {
  ok: boolean
  status: number
  statusText: string
  body?: string
  headers?: Record<string, string>
}

/**
 * 构建 Authorization header（Basic Auth）
 */
function buildAuthHeader(config: WebDAVConfig): string {
  const credentials = btoa(`${config.username}:${config.password}`)
  return `Basic ${credentials}`
}

/**
 * 拼接完整 URL
 */
function buildUrl(config: WebDAVConfig, path: string): string {
  const base = config.serverUrl.replace(/\/$/, '')
  const basePath = (config.basePath || '/bilibili-favorites/').replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${basePath}${cleanPath}`
}

/**
 * 通过 background service worker 发起 WebDAV 请求（绕过 CORS）
 */
async function sendWebDAVRequest(options: WebDAVRequestOptions): Promise<WebDAVResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'webdavRequest', data: options }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'WebDAV 请求失败'))
        return
      }
      if (!response) {
        reject(new Error('WebDAV 请求无响应'))
        return
      }
      resolve(response as WebDAVResponse)
    })
  })
}

/**
 * 测试 WebDAV 连接
 */
export async function connect(config: WebDAVConfig): Promise<boolean> {
  const url = buildUrl(config, '/')
  const response = await sendWebDAVRequest({
    method: 'PROPFIND',
    url,
    headers: {
      Authorization: buildAuthHeader(config),
      Depth: '0',
    },
  })
  // 207 Multi-Status 表示连接成功
  // 404 表示路径不存在，需要先创建
  return response.status === 207 || response.status === 200
}

/**
 * 创建目录（MKCOL）
 */
export async function mkcol(config: WebDAVConfig, path: string): Promise<boolean> {
  const url = buildUrl(config, path)
  const response = await sendWebDAVRequest({
    method: 'MKCOL',
    url,
    headers: {
      Authorization: buildAuthHeader(config),
    },
  })
  // 201 Created 或 405 Method Not Allowed（已存在）
  return response.status === 201 || response.status === 405
}

/**
 * 上传文件（PUT）
 */
export async function put(config: WebDAVConfig, path: string, data: string): Promise<boolean> {
  const url = buildUrl(config, path)
  const response = await sendWebDAVRequest({
    method: 'PUT',
    url,
    headers: {
      Authorization: buildAuthHeader(config),
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: data,
  })
  return response.status === 201 || response.status === 204 || response.status === 200
}

/**
 * 下载文件（GET）
 */
export async function get(config: WebDAVConfig, path: string): Promise<string | null> {
  const url = buildUrl(config, path)
  const response = await sendWebDAVRequest({
    method: 'GET',
    url,
    headers: {
      Authorization: buildAuthHeader(config),
    },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`WebDAV GET 失败: ${response.status} ${response.statusText}`)
  return response.body ?? null
}

/**
 * 查询文件信息（PROPFIND）- 获取最后修改时间
 */
export async function propfind(
  config: WebDAVConfig,
  path: string,
): Promise<{ lastModified: number } | null> {
  const url = buildUrl(config, path)
  const response = await sendWebDAVRequest({
    method: 'PROPFIND',
    url,
    headers: {
      Authorization: buildAuthHeader(config),
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:getlastmodified/>
  </d:prop>
</d:propfind>`,
  })

  if (response.status === 404) return null
  if (response.status !== 207) return null

  // 简单解析 getlastmodified
  const body = response.body || ''
  const match =
    body.match(/<d:getlastmodified>(.*?)<\/d:getlastmodified>/i) ||
    body.match(/<D:getlastmodified>(.*?)<\/D:getlastmodified>/i) ||
    body.match(/<lp1:getlastmodified>(.*?)<\/lp1:getlastmodified>/i)
  if (match && match[1]) {
    return { lastModified: new Date(match[1]).getTime() }
  }
  return null
}

/**
 * 确保远端目录结构存在
 */
export async function ensureDirectory(config: WebDAVConfig, path = '/'): Promise<void> {
  const segments = path.split('/').filter(Boolean)
  let current = '/'
  for (const segment of segments) {
    current += segment + '/'
    await mkcol(config, current)
  }
}
