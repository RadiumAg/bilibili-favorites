type HybridOrganizeStats = {
  runs: number
  tagHits: number
  aiHandled: number
  skipped: number
}

type TagHitCounts = Record<string, number>

const HYBRID_STATS_KEY = 'hybrid_organize_stats'
const TAG_HIT_COUNTS_KEY = 'tag_hit_counts'
const TAG_SUGGESTION_ADOPTED_KEY = 'tag_suggestion_adopted'

const canUseChromeStorage = () => typeof chrome !== 'undefined' && chrome.storage?.local != null

const getLocalValues = async <T extends Record<string, unknown>>(keys: string[]): Promise<T> => {
  if (!canUseChromeStorage()) return {} as T
  return (await chrome.storage.local.get(keys)) as T
}

const recordHybridOrganizeRun = async (input: {
  tagHits: number
  aiHandled: number
  skipped: number
}) => {
  if (!canUseChromeStorage()) return

  const values = await getLocalValues<{ hybrid_organize_stats?: HybridOrganizeStats }>([
    HYBRID_STATS_KEY,
  ])
  const current = values.hybrid_organize_stats ?? {
    runs: 0,
    tagHits: 0,
    aiHandled: 0,
    skipped: 0,
  }

  await chrome.storage.local.set({
    [HYBRID_STATS_KEY]: {
      runs: current.runs + 1,
      tagHits: current.tagHits + input.tagHits,
      aiHandled: current.aiHandled + input.aiHandled,
      skipped: current.skipped + input.skipped,
    } satisfies HybridOrganizeStats,
  })
}

const recordTagHits = async (hits: Array<{ favoriteId: number; matchedTags: string[] }>) => {
  if (!canUseChromeStorage() || hits.length === 0) return

  const values = await getLocalValues<{ tag_hit_counts?: TagHitCounts }>([TAG_HIT_COUNTS_KEY])
  const nextCounts: TagHitCounts = { ...(values.tag_hit_counts ?? {}) }

  hits.forEach((hit) => {
    hit.matchedTags.forEach((tag) => {
      const key = `${hit.favoriteId}:${tag}`
      nextCounts[key] = (nextCounts[key] ?? 0) + 1
    })
  })

  await chrome.storage.local.set({ [TAG_HIT_COUNTS_KEY]: nextCounts })
}

const getTagHitCounts = async (): Promise<TagHitCounts> => {
  const values = await getLocalValues<{ tag_hit_counts?: TagHitCounts }>([TAG_HIT_COUNTS_KEY])
  return values.tag_hit_counts ?? {}
}

const incrementTagSuggestionAdopted = async (count: number) => {
  if (!canUseChromeStorage() || count <= 0) return

  const values = await getLocalValues<{ tag_suggestion_adopted?: number }>([
    TAG_SUGGESTION_ADOPTED_KEY,
  ])
  await chrome.storage.local.set({
    [TAG_SUGGESTION_ADOPTED_KEY]: (values.tag_suggestion_adopted ?? 0) + count,
  })
}

export { getTagHitCounts, incrementTagSuggestionAdopted, recordHybridOrganizeRun, recordTagHits }
export type { HybridOrganizeStats, TagHitCounts }
