const STAR_INVITATION_STORAGE_KEYS = {
  popup: 'bilibili_favorites_star_invitation',
  options: 'bilibili_favorites_options_star_invitation',
} as const
const STAR_INVITATION_COMPLETED_STORAGE_KEY = 'bilibili_favorites_star_invitation_completed'
const STAR_INVITATION_REQUEST_EVENT_PREFIX = 'bilibili-favorites:request-star-invitation'

const STAR_INVITATION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const STAR_INVITATION_USAGE_INTERVAL = 3
const STAR_INVITATION_MAX_PROMPTS = 3

type StarInvitationState = {
  version: 1
  successfulUseCount: number
  promptCount: number
  pending: boolean
  completed: boolean
  lastPromptAt?: number
  lastPromptUseCount?: number
}

type StarInvitationScope = keyof typeof STAR_INVITATION_STORAGE_KEYS

type ConsumePendingResult = {
  state: StarInvitationState
  shouldShow: boolean
}

const createInitialStarInvitationState = (): StarInvitationState => ({
  version: 1,
  successfulUseCount: 0,
  promptCount: 0,
  pending: false,
  completed: false,
})

const toNonNegativeInteger = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

const toOptionalNonNegativeInteger = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

const normalizeStarInvitationState = (value: unknown): StarInvitationState => {
  if (value == null || typeof value !== 'object') {
    return createInitialStarInvitationState()
  }

  const candidate = value as Record<string, unknown>

  return {
    version: 1,
    successfulUseCount: toNonNegativeInteger(candidate.successfulUseCount),
    promptCount: toNonNegativeInteger(candidate.promptCount),
    pending: candidate.pending === true,
    completed: candidate.completed === true,
    lastPromptAt: toOptionalNonNegativeInteger(candidate.lastPromptAt),
    lastPromptUseCount: toOptionalNonNegativeInteger(candidate.lastPromptUseCount),
  }
}

const registerSuccessfulUse = (
  currentState: StarInvitationState,
  now: number,
): StarInvitationState => {
  const successfulUseCount = currentState.successfulUseCount + 1
  const nextState = {
    ...currentState,
    successfulUseCount,
  }

  if (
    currentState.completed ||
    currentState.pending ||
    currentState.promptCount >= STAR_INVITATION_MAX_PROMPTS
  ) {
    return nextState
  }

  const isFirstPrompt = currentState.promptCount === 0
  const hasWaitedLongEnough =
    currentState.lastPromptAt != null &&
    now - currentState.lastPromptAt >= STAR_INVITATION_COOLDOWN_MS
  const usesSinceLastPrompt =
    successfulUseCount - (currentState.lastPromptUseCount ?? currentState.successfulUseCount)
  const hasEnoughNewUses = usesSinceLastPrompt >= STAR_INVITATION_USAGE_INTERVAL

  return {
    ...nextState,
    pending: isFirstPrompt || (hasWaitedLongEnough && hasEnoughNewUses),
  }
}

const consumePendingInvitation = (
  currentState: StarInvitationState,
  now: number,
): ConsumePendingResult => {
  if (
    !currentState.pending ||
    currentState.completed ||
    currentState.promptCount >= STAR_INVITATION_MAX_PROMPTS
  ) {
    return {
      state: {
        ...currentState,
        pending: false,
      },
      shouldShow: false,
    }
  }

  return {
    state: {
      ...currentState,
      pending: false,
      promptCount: currentState.promptCount + 1,
      lastPromptAt: now,
      lastPromptUseCount: currentState.successfulUseCount,
    },
    shouldShow: true,
  }
}

const getStarInvitationRequestEvent = (scope: StarInvitationScope): string => {
  return `${STAR_INVITATION_REQUEST_EVENT_PREFIX}:${scope}`
}

const readStarInvitationState = async (
  scope: StarInvitationScope,
): Promise<StarInvitationState> => {
  const storageKey = STAR_INVITATION_STORAGE_KEYS[scope]
  const popupStorageKey = STAR_INVITATION_STORAGE_KEYS.popup
  const result = await chrome.storage.local.get([
    storageKey,
    popupStorageKey,
    STAR_INVITATION_COMPLETED_STORAGE_KEY,
  ])
  const scopeState = normalizeStarInvitationState(result[storageKey])
  const legacyPopupCompleted = normalizeStarInvitationState(result[popupStorageKey]).completed

  return {
    ...scopeState,
    completed: result[STAR_INVITATION_COMPLETED_STORAGE_KEY] === true || legacyPopupCompleted,
  }
}

const writeStarInvitationState = async (
  scope: StarInvitationScope,
  state: StarInvitationState,
): Promise<void> => {
  await chrome.storage.local.set({ [STAR_INVITATION_STORAGE_KEYS[scope]]: state })
}

const recordSuccessfulUseForStarInvitation = async (
  scope: StarInvitationScope,
): Promise<boolean> => {
  try {
    const currentState = await readStarInvitationState(scope)
    const nextState = registerSuccessfulUse(currentState, Date.now())
    await writeStarInvitationState(scope, nextState)
    return nextState.pending
  } catch (error) {
    console.warn('[Star Invitation] Failed to record successful use:', error)
    return false
  }
}

const consumePendingStarInvitation = async (scope: StarInvitationScope): Promise<boolean> => {
  try {
    const currentState = await readStarInvitationState(scope)
    const result = consumePendingInvitation(currentState, Date.now())

    if (result.state !== currentState) {
      await writeStarInvitationState(scope, result.state)
    }

    return result.shouldShow
  } catch (error) {
    console.warn('[Star Invitation] Failed to consume pending invitation:', error)
    return false
  }
}

const completeStarInvitation = async (scope: StarInvitationScope): Promise<void> => {
  try {
    const currentState = await readStarInvitationState(scope)
    await chrome.storage.local.set({
      [STAR_INVITATION_STORAGE_KEYS[scope]]: {
        ...currentState,
        pending: false,
        completed: true,
      },
      [STAR_INVITATION_COMPLETED_STORAGE_KEY]: true,
    })
  } catch (error) {
    console.warn('[Star Invitation] Failed to complete invitation:', error)
  }
}

const requestPendingStarInvitation = (scope: StarInvitationScope): void => {
  window.dispatchEvent(new Event(getStarInvitationRequestEvent(scope)))
}

export {
  STAR_INVITATION_COOLDOWN_MS,
  STAR_INVITATION_MAX_PROMPTS,
  STAR_INVITATION_USAGE_INTERVAL,
  completeStarInvitation,
  consumePendingInvitation,
  consumePendingStarInvitation,
  createInitialStarInvitationState,
  getStarInvitationRequestEvent,
  normalizeStarInvitationState,
  recordSuccessfulUseForStarInvitation,
  registerSuccessfulUse,
  requestPendingStarInvitation,
}
export type { StarInvitationScope, StarInvitationState }
