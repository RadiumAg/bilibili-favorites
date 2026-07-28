import { describe, expect, it } from 'vitest'
import {
  STAR_INVITATION_COOLDOWN_MS,
  STAR_INVITATION_MAX_PROMPTS,
  consumePendingInvitation,
  createInitialStarInvitationState,
  normalizeStarInvitationState,
  registerSuccessfulUse,
} from '../src/utils/star-invitation'

describe('star invitation fatigue rules', () => {
  it('首次成功使用后排队，并在消费时记录一次展示', () => {
    const now = Date.now()
    const queued = registerSuccessfulUse(createInitialStarInvitationState(), now)

    expect(queued.successfulUseCount).toBe(1)
    expect(queued.pending).toBe(true)

    const consumed = consumePendingInvitation(queued, now)

    expect(consumed.shouldShow).toBe(true)
    expect(consumed.state.pending).toBe(false)
    expect(consumed.state.promptCount).toBe(1)
    expect(consumed.state.lastPromptUseCount).toBe(1)
  })

  it('七天内即使再次成功使用也不重复提示', () => {
    const now = Date.now()
    const firstPrompt = consumePendingInvitation(
      registerSuccessfulUse(createInitialStarInvitationState(), now),
      now,
    ).state

    let afterThreeMoreUses = firstPrompt
    for (let index = 0; index < 3; index += 1) {
      afterThreeMoreUses = registerSuccessfulUse(
        afterThreeMoreUses,
        now + STAR_INVITATION_COOLDOWN_MS - 1,
      )
    }

    expect(afterThreeMoreUses.successfulUseCount).toBe(4)
    expect(afterThreeMoreUses.pending).toBe(false)
  })

  it('间隔七天且新增成功使用三次后再次排队', () => {
    const now = Date.now()
    const firstPrompt = consumePendingInvitation(
      registerSuccessfulUse(createInitialStarInvitationState(), now),
      now,
    ).state

    let afterTwoUses = firstPrompt
    for (let index = 0; index < 2; index += 1) {
      afterTwoUses = registerSuccessfulUse(afterTwoUses, now + STAR_INVITATION_COOLDOWN_MS)
    }
    const afterThreeUses = registerSuccessfulUse(afterTwoUses, now + STAR_INVITATION_COOLDOWN_MS)

    expect(afterTwoUses.pending).toBe(false)
    expect(afterThreeUses.pending).toBe(true)
  })

  it('确认支持后永久停止排队', () => {
    const completed = {
      ...createInitialStarInvitationState(),
      completed: true,
    }

    const afterUse = registerSuccessfulUse(completed, Date.now())

    expect(afterUse.successfulUseCount).toBe(1)
    expect(afterUse.pending).toBe(false)
  })

  it('达到最大展示次数后永久停止排队', () => {
    const maxedOut = {
      ...createInitialStarInvitationState(),
      successfulUseCount: 10,
      promptCount: STAR_INVITATION_MAX_PROMPTS,
      lastPromptAt: 0,
      lastPromptUseCount: 7,
    }

    const afterUse = registerSuccessfulUse(maxedOut, STAR_INVITATION_COOLDOWN_MS * 2)

    expect(afterUse.successfulUseCount).toBe(11)
    expect(afterUse.pending).toBe(false)
  })

  it('异常存储数据会被安全归一化', () => {
    expect(
      normalizeStarInvitationState({
        successfulUseCount: -2,
        promptCount: Number.NaN,
        pending: 'yes',
        completed: 1,
        lastPromptAt: 'yesterday',
      }),
    ).toEqual(createInitialStarInvitationState())
  })
})
