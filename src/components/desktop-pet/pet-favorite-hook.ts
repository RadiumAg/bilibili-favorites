/** 收藏成功时由 MAIN world content script 派发的自定义事件 */
export const PET_FAVORITE_ADDED_EVENT = 'bilibili-favorites-pet-fav-added'

/**
 * 收藏接口拦截由 `src/contentScript/pet-favorite-main.ts` 在 MAIN world 完成。
 * 这里保留入口，避免桌宠引擎关心具体注入方式。
 */
export function injectPetFavoriteHook(): void {
  document.documentElement.setAttribute('data-bili-pet-fav-listener', '1')
}

/** 监听收藏成功事件 */
export function listenPetFavoriteAdded(handler: () => void): () => void {
  window.addEventListener(PET_FAVORITE_ADDED_EVENT, handler)
  document.addEventListener(PET_FAVORITE_ADDED_EVENT, handler)
  return () => {
    window.removeEventListener(PET_FAVORITE_ADDED_EVENT, handler)
    document.removeEventListener(PET_FAVORITE_ADDED_EVENT, handler)
  }
}
