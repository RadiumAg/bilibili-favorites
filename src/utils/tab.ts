import { MessageEnum } from './message'

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

export const hasBilibiliTab = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: tabUrlPattern }, (tabs) => {
      if (chrome.runtime.lastError) {
        resolve(false)
        return
      }

      resolve(tabs.length > 0)
    })
  })
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

const sendMessageToRuntime = <T = any>(message: any, timeout: number = 10000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout: The background did not respond in time.'))
    }, timeout)

    chrome.runtime.sendMessage(message, (response: T) => {
      clearTimeout(timer)
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      resolve(response)
    })
  })
}

const isMissingContentScriptError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false

  return (
    error.message.includes('Receiving end does not exist') ||
    error.message.includes('Could not establish connection')
  )
}

type InjectableContentScript = {
  js: string[]
  css: string[]
}

type ManifestContentScriptEntry = NonNullable<
  chrome.runtime.ManifestV3['content_scripts']
>[number] & {
  world?: string
}

const getManifestContentScript = (): InjectableContentScript => {
  const contentScript = chrome.runtime.getManifest().content_scripts?.find((entry) => {
    const world = (entry as ManifestContentScriptEntry).world
    return world !== 'MAIN' && Boolean(entry.js?.length)
  })

  if (!contentScript?.js?.length) {
    throw new Error('Bilibili content script entry was not found in the extension manifest.')
  }

  return {
    js: contentScript.js,
    css: contentScript.css ?? [],
  }
}

const wait = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const waitForContentScript = async (tabId: number): Promise<void> => {
  const maxAttempts = 20

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const ready = await sendMessageToTab<boolean>(
        tabId,
        { type: MessageEnum.pingContentScript },
        1000,
      )
      if (ready) return
    } catch {
      await wait(100)
    }
  }

  throw new Error('Bilibili content script did not become ready after injection.')
}

const injectContentScript = async (tabId: number): Promise<void> => {
  const contentScript = getManifestContentScript()

  if (contentScript.css.length > 0) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: contentScript.css,
    })
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: contentScript.js,
  })
  await waitForContentScript(tabId)
}

const sendMessageWithContentScript = async <T>(
  tabId: number,
  message: any,
  timeout: number,
): Promise<T> => {
  try {
    return await sendMessageToTab<T>(tabId, message, timeout)
  } catch (error) {
    if (!isMissingContentScriptError(error)) throw error

    await injectContentScript(tabId)
    return sendMessageToTab<T>(tabId, message, timeout)
  }
}

/**
 * 查询 B 站标签页并向第一个标签页发送消息
 * @param message 要发送的消息
 * @param timeout 超时时间（毫秒），默认 10000ms
 * @returns Promise<T> 返回的消息响应
 */
export const queryAndSendMessage = <T = any>(message: any, timeout: number = 10000): Promise<T> => {
  if (message?.type === MessageEnum.getCookieFromChrome) {
    return sendMessageToRuntime<T>(message, timeout)
  }

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

      sendMessageWithContentScript<T>(tabId, message, timeout).then(resolve).catch(reject)
    })
  })
}

export const getExtensionDeviceId = async () => {
  const { deviceId } = await chrome.storage.local.get('deviceId')
  if (!deviceId) {
    const newId = crypto.randomUUID()
    await chrome.storage.local.set({ deviceId: newId })
    return newId
  }
  return deviceId
}
