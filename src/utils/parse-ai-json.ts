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
