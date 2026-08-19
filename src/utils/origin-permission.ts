/**
 * Ensure the extension can reach the configured AI origin.
 * Custom providers are covered by optional_host_permissions and therefore
 * need an explicit user-granted origin permission before background fetches.
 */
const requestOriginPermission = async (baseUrl: string): Promise<boolean> => {
  const url = new URL(baseUrl)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('AI Base URL 只支持 http/https 地址')
  }

  const origin = `${url.origin}/*`
  if (await chrome.permissions.contains({ origins: [origin] })) return true
  return chrome.permissions.request({ origins: [origin] })
}

export { requestOriginPermission }
