import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { Github } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  completeStarInvitation,
  consumePendingStarInvitation,
  getStarInvitationRequestEvent,
  type StarInvitationScope,
} from '@/utils/star-invitation'

const GITHUB_REPOSITORY_URL = 'https://github.com/RadiumAg/bilibili-favorites'

type StarInvitationProps = {
  scope: StarInvitationScope
}

const StarInvitation: React.FC<StarInvitationProps> = ({ scope }) => {
  const [open, setOpen] = React.useState(false)
  const requestEvent = getStarInvitationRequestEvent(scope)

  const showPendingInvitation = useMemoizedFn(async () => {
    if (await consumePendingStarInvitation(scope)) {
      setOpen(true)
    }
  })

  React.useEffect(() => {
    const handleInvitationRequest = () => {
      showPendingInvitation()
    }

    window.addEventListener(requestEvent, handleInvitationRequest)
    showPendingInvitation()

    return () => {
      window.removeEventListener(requestEvent, handleInvitationRequest)
    }
  }, [requestEvent, showPendingInvitation])

  const handleSupportProject = async () => {
    await completeStarInvitation(scope)
    try {
      await chrome.tabs.create({
        url: GITHUB_REPOSITORY_URL,
        active: true,
      })
    } catch (error) {
      console.warn('[Star Invitation] Failed to open GitHub:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-sm gap-5 rounded-xl border-[#00AEEC]/25 p-5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00AEEC]/10 text-[#008CC1]"
          aria-hidden="true"
        >
          <Github className="h-6 w-6" />
        </div>

        <AlertDialogHeader className="space-y-2 text-left">
          <AlertDialogTitle className="text-lg text-b-text-primary">
            觉得好用的话，支持一下吧
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-6 text-gray-600">
            去 GitHub 点个 Star，帮助这个项目被更多人看到。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel className="min-h-11 flex-1 cursor-pointer">下次再说</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSupportProject}
            className="min-h-11 flex-1 cursor-pointer gap-2 bg-[#00AEEC] text-white transition-colors duration-200 hover:bg-[#0099D4] focus-visible:ring-[#00AEEC]"
          >
            <Github className="h-4 w-4" aria-hidden="true" />去 GitHub 点 Star
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default StarInvitation
