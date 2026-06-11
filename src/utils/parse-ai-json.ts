import { jsonrepair } from 'jsonrepair'

/**
 * 解析 AI 返回的 JSON，处理 markdown 代码块包裹、截断、格式异常等情况
 */
export function parseAIJSON<T = any>(text: string): T {
  // 先尝试匹配 ```json ... ``` 或 ``` ... ``` 包裹的内容
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/)
  if (jsonMatch) {
    return JSON.parse(jsonrepair(jsonMatch[1].trim()))
  }
  // 没有代码块包裹，直接解析
  return JSON.parse(jsonrepair(text.trim()))
}

/**
 * 从流式文本中增量提取完整的 JSON 对象
 * AI 返回格式: [{...}, {...}, ...]，逐字符检测花括号配对
 */
export const extractCompleteObjects = (buffer: string): { objects: any[]; remaining: string } => {
  const objects: any[] = []
  let depth = 0
  let inString = false
  let escape = false
  let objectStart = -1

  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i]

    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') {
      if (depth === 0) objectStart = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && objectStart !== -1) {
        const jsonStr = buffer.slice(objectStart, i + 1)
        try {
          objects.push(JSON.parse(jsonStr))
        } catch {
          // 解析失败则跳过
        }
        objectStart = -1
      }
    }
  }

  // 返回未完成部分
  const remaining = objectStart !== -1 ? buffer.slice(objectStart) : ''
  return { objects, remaining }
}
