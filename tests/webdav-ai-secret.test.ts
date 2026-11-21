import { describe, expect, it } from 'vitest'
import {
  mergeAIConfigFromWebDAV,
  sanitizeAIConfigForWebDAV,
} from '../src/utils/sync-service'

describe('WebDAV AI config secret handling', () => {
  it('上传同步应移除 key/apiKey 且不修改原对象', () => {
    const source = {
      key: 'local-secret',
      apiKey: 'legacy-secret',
      baseUrl: 'https://example.com/v1',
      model: 'example-model',
      extraParams: { temperature: 0.2 },
    }

    expect(sanitizeAIConfigForWebDAV(source)).toEqual({
      baseUrl: 'https://example.com/v1',
      model: 'example-model',
      extraParams: { temperature: 0.2 },
    })
    expect(source.key).toBe('local-secret')
    expect(source.apiKey).toBe('legacy-secret')
  })

  it('下载同步不得接受远端密钥，并应保留本机已有密钥', () => {
    const local = { key: 'keep-local', apiKey: 'keep-legacy', model: 'old-model' }
    const remote = {
      key: 'remote-injected',
      apiKey: 'remote-legacy-injected',
      model: 'new-model',
      baseUrl: 'https://remote.example/v1',
    }

    expect(mergeAIConfigFromWebDAV(local, remote)).toEqual({
      key: 'keep-local',
      apiKey: 'keep-legacy',
      model: 'new-model',
      baseUrl: 'https://remote.example/v1',
    })
  })

  it('本机没有密钥时，远端密钥应被丢弃而不是写入本机', () => {
    expect(
      mergeAIConfigFromWebDAV(
        { model: 'local-model' },
        { key: 'remote-secret', apiKey: 'remote-legacy', model: 'remote-model' },
      ),
    ).toEqual({ model: 'remote-model' })
  })
})
