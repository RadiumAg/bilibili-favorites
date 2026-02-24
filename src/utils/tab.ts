// 用于 manifest.ts 中的 content_scripts.matches
export const bilibiliUrlPatterns = [
  'https://*.bilibili.com/*',
  'https://bilibili.com/*',
  'http://*.bilibili.com/*',
  'http://bilibili.com/*',
]

// 用于 chrome.tabs.query 的模式（支持所有 B 站域名）
export const tabUrlPattern = '*://*.bilibili.com/*'

// 检查 URL 是否为 B 站域名的函数
export const isBilibiliUrl = (url: string): boolean => {
  return bilibiliUrlPatterns.some((pattern) => {
    // 将通配符模式转换为正则表达式
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.')
    const regex = new RegExp(`^${regexPattern}`)
    return regex.test(url)
  })
}

/**
 * 查询 B 站相关的标签页
 * @param callback 回调函数，接收查询到的标签页数组
 */
export const queryBilibiliTabs = (callback: (tabs: chrome.tabs.Tab[]) => void): void => {
  chrome.tabs.query({ url: tabUrlPattern }, callback)
}

/**
 * 向指定标签页发送消息并返回 Promise
 * @param tabId 标签页 ID
 * @param message 要发送的消息
 * @param timeout 超时时间（毫秒），默认 10000ms
 * @returns Promise<T> 返回的消息响应
 */
export const sendMessageToTab = <T = any>(
  tabId: number,
  message: any,
  timeout: number = 10000,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    // 设置超时定时器
    const timer = setTimeout(() => {
      reject(new Error('Message timeout: The message port closed before a response was received.'))
    }, timeout)

    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timer)
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

/**
 * 查询 B 站标签页并向第一个标签页发送消息
 * @param message 要发送的消息
 * @param timeout 超时时间（毫秒），默认 10000ms
 * @returns Promise<T> 返回的消息响应
 */
export const queryAndSendMessage = <T = any>(message: any, timeout: number = 10000): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: tabUrlPattern }, (tabs) => {
      if (tabs == null || tabs.length === 0) {
        reject(new Error('No Bilibili tabs found'))
        return
      }

      const tabId = tabs[0].id
      if (tabId == null) {
        reject(new Error('Tab ID is null'))
        return
      }

      sendMessageToTab<T>(tabId, message, timeout).then(resolve).catch(reject)
    })
  })
}

/**
 * 分页获取某个收藏夹的全部视频列表
 * @param mediaId 收藏夹 ID
 * @param pageSize 每页数量，默认 40（B 站最大值）
 * @returns 该收藏夹下的全部视频
 */
export const fetchAllFavoriteMedias = async <T extends { id: number; title: string }>(
  mediaId: string,
  pageSize = 40,
): Promise<T[]> => {
  const allMedias: T[] = []
  let currentPage = 1
  let hasMore = true

  while (hasMore) {
    const response = await queryAndSendMessage<{
      code: number
      message: string
      data: { medias: T[] | null; has_more: boolean }
    }>({
      type: 'getFavoriteList',
      data: { mediaId, pn: currentPage, ps: pageSize },
    })

    if (response.code !== 0) {
      throw new Error(response.message || '获取收藏夹数据失败')
    }

    const medias = response.data.medias
    if (medias && medias.length > 0) {
      allMedias.push(...medias)
    }

    hasMore = response.data.has_more
    currentPage++
  }

  return allMedias
}
