export {}

const PET_FAVORITE_ADDED_EVENT = 'bilibili-favorites-pet-fav-added'
const FAV_DEAL_PATH = '/x/v3/fav/resource/deal'

declare global {
  interface Window {
    __biliPetFavHookInstalled?: boolean
  }
}

type BilibiliFavResponse = {
  code?: number
}

type HookedXMLHttpRequest = XMLHttpRequest & {
  __biliPetFavUrl?: string
}

function isFavDealUrl(url: unknown): boolean {
  return typeof url === 'string' && url.includes(FAV_DEAL_PATH)
}

function parseRequestBody(body: XMLHttpRequestBodyInit | BodyInit | null | undefined) {
  if (!body) return null
  if (typeof body === 'string') {
    try {
      return new URLSearchParams(body)
    } catch {
      return null
    }
  }
  if (body instanceof URLSearchParams) return body
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body
  return null
}

function isAddFavoriteBody(body: XMLHttpRequestBodyInit | BodyInit | null | undefined): boolean {
  const parsed = parseRequestBody(body)
  if (!parsed) return false

  if (parsed instanceof URLSearchParams) {
    return Boolean(parsed.get('add_media_ids'))
  }
  if (typeof FormData !== 'undefined' && parsed instanceof FormData) {
    return parsed.has('add_media_ids')
  }
  return false
}

let lastEmitAt = 0

function emitFavoriteAdded(): void {
  const now = Date.now()
  if (now - lastEmitAt < 800) return
  lastEmitAt = now

  const eventInit: CustomEventInit = {
    bubbles: true,
    composed: true,
    detail: { source: 'fav-resource-deal' },
  }
  window.dispatchEvent(new CustomEvent(PET_FAVORITE_ADDED_EVENT, eventInit))
  document.dispatchEvent(new CustomEvent(PET_FAVORITE_ADDED_EVENT, eventInit))
}

function handleSuccess(body: XMLHttpRequestBodyInit | BodyInit | null | undefined): void {
  if (isAddFavoriteBody(body)) {
    emitFavoriteAdded()
  }
}

function normalizeXhrBody(
  body: Document | XMLHttpRequestBodyInit | null | undefined,
): XMLHttpRequestBodyInit | null | undefined {
  return body instanceof Document ? null : body
}

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function getFetchBody(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.body) return init.body
  // Request.body is a stream and cannot be synchronously inspected here.
  // B 站收藏接口当前使用 init.body / XHR body，保留 Request URL 兼容即可。
  return null
}

function installFetchHook(): void {
  const originalFetch = window.fetch
  if (typeof originalFetch !== 'function') return

  window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const url = getFetchUrl(input)
    const body = getFetchBody(input, init)

    return originalFetch.call(this, input, init).then((response) => {
      if (isFavDealUrl(url)) {
        response
          .clone()
          .json()
          .then((data: BilibiliFavResponse) => {
            if (data?.code === 0) {
              handleSuccess(body)
            }
          })
          .catch(() => {})
      }
      return response
    })
  }
}

function installXhrHook(): void {
  const xhrOpen = XMLHttpRequest.prototype.open
  const xhrSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function patchedOpen(
    this: HookedXMLHttpRequest,
    method: string,
    url: string | URL,
  ) {
    this.__biliPetFavUrl = typeof url === 'string' ? url : url.toString()
    return xhrOpen.apply(this, arguments as any)
  }

  XMLHttpRequest.prototype.send = function patchedSend(
    this: HookedXMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    if (isFavDealUrl(this.__biliPetFavUrl)) {
      this.addEventListener('load', () => {
        if (this.status < 200 || this.status >= 300) return
        try {
          const data = JSON.parse(this.responseText) as BilibiliFavResponse
          if (data?.code === 0) {
            handleSuccess(normalizeXhrBody(body))
          }
        } catch {
          // ignore malformed responses
        }
      })
    }
    return xhrSend.apply(this, arguments as any)
  }
}

if (!window.__biliPetFavHookInstalled) {
  window.__biliPetFavHookInstalled = true
  installFetchHook()
  installXhrHook()
  document.documentElement.setAttribute('data-bili-pet-fav-main-hook', '1')
}
