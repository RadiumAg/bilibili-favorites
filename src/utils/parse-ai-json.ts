import { jsonrepair } from 'jsonrepair'

/**
 * 解析 AI 返回的 JSON，处理 markdown 代码块包裹、截断、格式异常等情况
 */
export function parseAIJSON<T = any>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
  return JSON.parse(jsonrepair(jsonStr))
}
