import React from 'react'
import {
  recordSuccessfulUseForStarInvitation,
  requestPendingStarInvitation,
} from '@/utils/star-invitation'

const useStarInvitation = () => {
  const shouldShowAfterCloseRef = React.useRef(false)

  const resetStarInvitation = React.useCallback(() => {
    shouldShowAfterCloseRef.current = false
  }, [])

  const recordSuccessfulUse = React.useCallback(async () => {
    shouldShowAfterCloseRef.current = await recordSuccessfulUseForStarInvitation()
  }, [])

  const showStarInvitationAfterClose = React.useCallback(() => {
    if (!shouldShowAfterCloseRef.current) return

    shouldShowAfterCloseRef.current = false
    requestPendingStarInvitation()
  }, [])

  return {
    recordSuccessfulUse,
    resetStarInvitation,
    showStarInvitationAfterClose,
  }
}

export { useStarInvitation }
