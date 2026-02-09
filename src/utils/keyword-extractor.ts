/**
 * 关键词提取工具
 * 提供本地 TF-IDF 算法进行关键词提取
 */

export type KeywordResult = {
  keyword: string
  score: number
}

/**
 * 停用词列表（常见无意义词）
 */
const STOP_WORDS = new Set([
  '的',
  '了',
  '在',
  '是',
  '我',
  '有',
  '和',
  '就',
  '不',
  '人',
  '都',
  '一',
  '一个',
  '上',
  '也',
  '很',
  '到',
  '说',
  '要',
  '去',
  '你',
  '会',
  '着',
  '没有',
  '看',
  '好',
  '自己',
  '这',
  '那',
  '里',
  '就是',
  '什么',
  '可以',
  '这个',
  '我们',
  '他',
  '她',
  '教程',
  '视频',
  '合集',
  '系列',
  '第',
  '集',
  '期',
  '完整版',
  '全集',
  '更新',
  '最新',
  '高清',
  '中文',
  '字幕',
])

/**
 * 中文分词（简单实现）
 * 提取单词和2-4字的中文词组
 */
function simpleTokenize(text: string): string[] {
  // 移除标点符号和特殊字符
  const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')

  // 按空格分词（处理英文单词）
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0)

  // 提取2-4字的中文词组
  const phrases: string[] = []
  for (let i = 0; i < text.length - 1; i++) {
    for (let len = 2; len <= 4; len++) {
      if (i + len <= text.length) {
        const phrase = text.slice(i, i + len)
        // 只提取纯中文词组
        if (/^[\u4e00-\u9fa5]+$/.test(phrase)) {
          phrases.push(phrase)
        }
      }
    }
  }

  return [...words, ...phrases]
}

/**
 * 计算词频（TF）
 */
function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()

  tokens.forEach((token) => {
    tf.set(token, (tf.get(token) || 0) + 1)
  })

  return tf
}

/**
 * 计算逆文档频率（IDF）
 */
function calculateIDF(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>()
  const docCount = documents.length

  // 统计每个词出现在多少个文档中
  const docFreq = new Map<string, number>()
  documents.forEach((doc) => {
    const uniqueWords = new Set(doc)
    uniqueWords.forEach((word) => {
      docFreq.set(word, (docFreq.get(word) || 0) + 1)
    })
  })

  // 计算 IDF
  docFreq.forEach((freq, word) => {
    idf.set(word, Math.log(docCount / freq))
  })

  return idf
}

/**
 * 从标题列表中提取关键词（使用 TF-IDF 算法）
 * 当文档数量过少时（≤2），回退到纯词频算法
 */
export function extractKeywords(
  titles: string[],
  options: {
    maxKeywords?: number
    minScore?: number
    minLength?: number
  } = {},
): KeywordResult[] {
  const { maxKeywords = 10, minScore = 0.1, minLength = 2 } = options

  if (!titles || titles.length === 0) {
    return []
  }

  // 1. 分词
  const documents = titles.map((title) => simpleTokenize(title))
  const allTokens = documents.flat()

  // 2. 计算分数
  let scoreMap: Map<string, number>

  if (titles.length <= 2) {
    // 文档数量过少，使用纯词频（TF）算法
    scoreMap = calculateTF(allTokens)
  } else {
    // 文档数量足够，使用 TF-IDF 算法
    const tf = calculateTF(allTokens)
    const idf = calculateIDF(documents)

    scoreMap = new Map<string, number>()
    tf.forEach((tfValue, word) => {
      const idfValue = idf.get(word) || 0
      scoreMap.set(word, tfValue * idfValue)
    })
  }

  // 3. 过滤和排序
  const keywords: KeywordResult[] = []

  scoreMap.forEach((score, keyword) => {
    // 过滤条件
    if (keyword.length >= minLength && !STOP_WORDS.has(keyword) && score >= minScore) {
      keywords.push({ keyword, score })
    }
  })

  // 按分数降序排序
  keywords.sort((a, b) => b.score - a.score)

  return keywords.slice(0, maxKeywords)
}

/**
 * 快速提取关键词（简化版）
 * 直接返回关键词字符串数组
 */
export function quickExtractKeywords(titles: string[], maxKeywords = 10): string[] {
  const results = extractKeywords(titles, { maxKeywords })
  return results.map((r) => r.keyword)
}
