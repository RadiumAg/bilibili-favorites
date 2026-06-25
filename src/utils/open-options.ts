/** 打开扩展 options 页（content script 中不要用 window.open，会被浏览器拦截） */
export function openOptionsPage(tab: string): void {
  void chrome.tabs.create({
    url: `options.html?tab=${tab}`,
    active: true,
  })
}
