import React from 'react'
import { useMemoizedFn } from 'ahooks'
import {
  recordSuccessfulUseForStarInvitation,
  requestPendingStarInvitation,
  type StarInvitationScope,
} from '@/utils/star-invitation'

const useStarInvitation = (scope: StarInvitationScope) => {
  const shouldShowAfterCloseRef = React.useRef(false)

  const resetStarInvitation = useMemoizedFn(() => {
    shouldShowAfterCloseRef.current = false
  })

  const recordSuccessfulUse = useMemoizedFn(async () => {
    shouldShowAfterCloseRef.current = await recordSuccessfulUseForStarInvitation(scope)
  })

  const showStarInvitationAfterClose = useMemoizedFn(() => {
    if (!shouldShowAfterCloseRef.current) return

    shouldShowAfterCloseRef.current = false
    requestPendingStarInvitation(scope)
  })

  return {
    recordSuccessfulUse,
    resetStarInvitation,
    showStarInvitationAfterClose,
  }
}

export { useStarInvitation }
