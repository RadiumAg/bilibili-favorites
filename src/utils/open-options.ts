/** 打开扩展 options 页（content script 无 chrome.tabs 权限，需经 background 打开） */
export function openOptionsPage(tab: string) {
  chrome.runtime.sendMessage({ type: 'openOptionsPage', tab })
}
