import React from 'react'
import { FC } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExtractionMode } from '@/hooks/use-create-keyword'

type KeywordModeSelectorProps = {
  value: ExtractionMode
  onChange: (mode: ExtractionMode) => void
  disabled?: boolean
}

const KeywordModeSelector: FC<KeywordModeSelectorProps> = (props) => {
  const { value, onChange, disabled = false } = props

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="选择提取模式" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="local">
          <div className="flex flex-col">
            <span className="font-medium">本地算法</span>
            <span className="text-xs text-gray-500">快速、免费</span>
          </div>
        </SelectItem>
        <SelectItem value="ai">
          <div className="flex flex-col">
            <span className="font-medium">AI 智能</span>
            <span className="text-xs text-gray-500">准确、需配置</span>
          </div>
        </SelectItem>
        {/* <SelectItem value="manual">
          <div className="flex flex-col">
            <span className="font-medium">手动输入</span>
            <span className="text-xs text-gray-500">完全自定义</span>
          </div>
        </SelectItem> */}
      </SelectContent>
    </Select>
  )
}

export default KeywordModeSelector
