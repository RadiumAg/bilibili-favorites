type TagMatcherVideo = {
  id: number
  title: string
}

type TagMatcherFavorite = {
  id: number
  title: string
}

type FavoriteKeyword = {
  favoriteDataId: number
  value: Array<{ value: string }>
}

type TagMatchResult = {
  videoId: number
  videoTitle: string
  targetFavoriteId: number
  matchedTags: string[]
  isSourceMatch: boolean
}

type UnresolvedTagMatch = {
  videoId: number
  videoTitle: string
  candidateFavoriteIds: number[]
  candidateFavoriteTitles: string[]
  matchedTags: string[]
}

type TagMatchSummary = {
  matched: TagMatchResult[]
  unresolved: UnresolvedTagMatch[]
  hasAnyTags: boolean
}

const normalizeTagText = (value: string) => value.trim().toLowerCase()

const uniqueStrings = (values: string[]) => [...new Set(values)]

const matchVideosByTags = (
  videos: TagMatcherVideo[],
  favorites: TagMatcherFavorite[],
  keywords: FavoriteKeyword[],
  sourceFavoriteId: number,
): TagMatchSummary => {
  const favoriteTitleMap = new Map(favorites.map((favorite) => [favorite.id, favorite.title]))
  const tagGroups = keywords
    .map((keyword) => ({
      favoriteDataId: keyword.favoriteDataId,
      tags: keyword.value
        .map((item) => ({ raw: item.value.trim(), normalized: normalizeTagText(item.value) }))
        .filter((item) => item.normalized.length > 0),
    }))
    .filter((group) => group.tags.length > 0 && favoriteTitleMap.has(group.favoriteDataId))

  const sourceGroup = tagGroups.find((group) => group.favoriteDataId === sourceFavoriteId)
  const targetGroups = tagGroups.filter((group) => group.favoriteDataId !== sourceFavoriteId)
  const matched: TagMatchResult[] = []
  const unresolved: UnresolvedTagMatch[] = []

  videos.forEach((video) => {
    const normalizedTitle = normalizeTagText(video.title)
    const sourceMatchedTags =
      sourceGroup?.tags
        .filter((tag) => normalizedTitle.includes(tag.normalized))
        .map((tag) => tag.raw) ?? []

    if (sourceMatchedTags.length > 0) {
      matched.push({
        videoId: video.id,
        videoTitle: video.title,
        targetFavoriteId: sourceFavoriteId,
        matchedTags: uniqueStrings(sourceMatchedTags),
        isSourceMatch: true,
      })
      return
    }

    const targetMatches = targetGroups
      .map((group) => ({
        favoriteDataId: group.favoriteDataId,
        tags: group.tags
          .filter((tag) => normalizedTitle.includes(tag.normalized))
          .map((tag) => tag.raw),
      }))
      .filter((group) => group.tags.length > 0)

    if (targetMatches.length === 1) {
      matched.push({
        videoId: video.id,
        videoTitle: video.title,
        targetFavoriteId: targetMatches[0].favoriteDataId,
        matchedTags: uniqueStrings(targetMatches[0].tags),
        isSourceMatch: false,
      })
      return
    }

    unresolved.push({
      videoId: video.id,
      videoTitle: video.title,
      candidateFavoriteIds: targetMatches.map((match) => match.favoriteDataId),
      candidateFavoriteTitles: targetMatches
        .map((match) => favoriteTitleMap.get(match.favoriteDataId))
        .filter((title): title is string => title != null),
      matchedTags: uniqueStrings(targetMatches.flatMap((match) => match.tags)),
    })
  })

  return {
    matched,
    unresolved,
    hasAnyTags: tagGroups.length > 0,
  }
}

export { matchVideosByTags, normalizeTagText }
export type {
  FavoriteKeyword,
  TagMatcherFavorite,
  TagMatcherVideo,
  TagMatchResult,
  TagMatchSummary,
  UnresolvedTagMatch,
}
