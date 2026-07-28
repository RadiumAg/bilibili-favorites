import React from 'react'
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
  STAR_INVITATION_REQUEST_EVENT,
  completeStarInvitation,
  consumePendingStarInvitation,
} from '@/utils/star-invitation'

const GITHUB_REPOSITORY_URL = 'https://github.com/RadiumAg/bilibili-favorites'

const StarInvitation: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  const showPendingInvitation = React.useCallback(async () => {
    if (await consumePendingStarInvitation()) {
      setOpen(true)
    }
  }, [])

  React.useEffect(() => {
    const handleInvitationRequest = () => {
      void showPendingInvitation()
    }

    window.addEventListener(STAR_INVITATION_REQUEST_EVENT, handleInvitationRequest)
    void showPendingInvitation()

    return () => {
      window.removeEventListener(STAR_INVITATION_REQUEST_EVENT, handleInvitationRequest)
    }
  }, [showPendingInvitation])

  const handleSupportProject = async () => {
    await completeStarInvitation()
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
            onClick={() => {
              void handleSupportProject()
            }}
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
