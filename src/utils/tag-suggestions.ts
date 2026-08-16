import { quickExtractKeywords } from './keyword-extractor'
import { normalizeTagText } from './tag-matcher'

type TagSuggestionGroup = {
  favoriteId: number
  favoriteTitle: string
  videoCount: number
  candidates: string[]
}

type SuggestionSource = {
  favoriteId: number
  favoriteTitle: string
  titles: string[]
  existingTags: string[]
}

const isTooShortLatinKeyword = (keyword: string) =>
  /^[a-z\d]+$/i.test(keyword) && keyword.length < 2

const createTagSuggestionGroups = (sources: SuggestionSource[]): TagSuggestionGroup[] => {
  return sources.flatMap((source) => {
    if (source.titles.length < 3) return []

    const minFrequency = source.titles.length < 4 ? 1 : 2
    const existingTags = new Set(source.existingTags.map(normalizeTagText))
    const candidates = quickExtractKeywords(source.titles, 24)
      .filter((keyword) => !isTooShortLatinKeyword(keyword))
      .filter((keyword) => !existingTags.has(normalizeTagText(keyword)))
      .filter((keyword) => {
        const normalizedKeyword = normalizeTagText(keyword)
        return (
          source.titles.filter((title) => normalizeTagText(title).includes(normalizedKeyword))
            .length >= minFrequency
        )
      })
      .filter((keyword, index, values) => {
        const normalized = normalizeTagText(keyword)
        return values.findIndex((value) => normalizeTagText(value) === normalized) === index
      })
      .slice(0, 5)

    if (candidates.length < 3) return []

    return [
      {
        favoriteId: source.favoriteId,
        favoriteTitle: source.favoriteTitle,
        videoCount: source.titles.length,
        candidates,
      },
    ]
  })
}

export { createTagSuggestionGroups }
export type { SuggestionSource, TagSuggestionGroup }
