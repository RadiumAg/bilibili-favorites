/** 收藏成功时由注入脚本派发的自定义事件 */
export const PET_FAVORITE_ADDED_EVENT = 'bilibili-favorites-pet-fav-added'

const FAV_DEAL_PATH = '/x/v3/fav/resource/deal'
const INJECT_FLAG = 'data-bili-pet-fav-hook'

function buildInjectScript(eventName: string, apiPath: string): string {
  return `
(function () {
  if (window.__biliPetFavHookInstalled) return;
  window.__biliPetFavHookInstalled = true;

  var API_PATH = ${JSON.stringify(apiPath)};
  var EVENT_NAME = ${JSON.stringify(eventName)};
  var lastEmitAt = 0;

  function isFavDealUrl(url) {
    return typeof url === 'string' && url.indexOf(API_PATH) !== -1;
  }

  function parseRequestBody(body) {
    if (!body) return null;
    if (typeof body === 'string') {
      try {
        return new URLSearchParams(body);
      } catch (e) {
        return null;
      }
    }
    if (body instanceof URLSearchParams) return body;
    if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
    return null;
  }

  function isAddFavoriteBody(body) {
    var parsed = parseRequestBody(body);
    if (!parsed) return false;
    if (parsed instanceof URLSearchParams) {
      var addIds = parsed.get('add_media_ids');
      return !!addIds;
    }
    if (typeof FormData !== 'undefined' && parsed instanceof FormData) {
      return parsed.has('add_media_ids');
    }
    return false;
  }

  function emitFavoriteAdded() {
    var now = Date.now();
    if (now - lastEmitAt < 800) return;
    lastEmitAt = now;
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  function handleSuccess(body) {
    if (isAddFavoriteBody(body)) {
      emitFavoriteAdded();
    }
  }

  var originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var requestInit = init || {};
      return originalFetch.call(this, input, init).then(function (response) {
        if (isFavDealUrl(url)) {
          response
            .clone()
            .json()
            .then(function (data) {
              if (data && data.code === 0) {
                handleSuccess(requestInit.body);
              }
            })
            .catch(function () {});
        }
        return response;
      });
    };
  }

  var xhrOpen = XMLHttpRequest.prototype.open;
  var xhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__biliPetFavUrl = url;
    return xhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this;
    if (isFavDealUrl(xhr.__biliPetFavUrl)) {
      xhr.addEventListener('load', function () {
        if (xhr.status < 200 || xhr.status >= 300) return;
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.code === 0) {
            handleSuccess(body);
          }
        } catch (e) {}
      });
    }
    return xhrSend.apply(this, arguments);
  };
})();
`
}

/** 向页面主环境注入收藏接口拦截脚本 */
export function injectPetFavoriteHook(): void {
  const root = document.documentElement
  if (root.getAttribute(INJECT_FLAG) === '1') return

  const script = document.createElement('script')
  script.textContent = buildInjectScript(PET_FAVORITE_ADDED_EVENT, FAV_DEAL_PATH)
  ;(document.head || root).appendChild(script)
  script.remove()
  root.setAttribute(INJECT_FLAG, '1')
}

/** 监听收藏成功事件 */
export function listenPetFavoriteAdded(handler: () => void): () => void {
  window.addEventListener(PET_FAVORITE_ADDED_EVENT, handler)
  return () => window.removeEventListener(PET_FAVORITE_ADDED_EVENT, handler)
}
