/** 打开标签整理页 */
export function openOrganizePage(): void {
  window.open(chrome.runtime.getURL('options.html?tab=keyword-manager'), '_blank')
}

export function openAnalysisPage(): void {
  window.open(chrome.runtime.getURL('options.html?tab=analysis'), '_blank')
}
