'use client'

import { Button } from '@/components/ui'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const dismissedAnnouncementStorageKey = 'clocktower-dismissed-announcement-hash'

export default function AnnouncementBannerClient({
  announcementHash,
  markdown,
}: {
  announcementHash: string
  markdown: string
}) {
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    const dismissedHash = window.localStorage.getItem(
      dismissedAnnouncementStorageKey,
    )
    setIsDismissed(dismissedHash === announcementHash)
  }, [announcementHash])

  const handleDismiss = () => {
    window.localStorage.setItem(
      dismissedAnnouncementStorageKey,
      announcementHash,
    )
    setIsDismissed(true)
  }

  if (isDismissed) return null

  return (
    <section
      aria-label='Announcement'
      className='border-b border-[#759f95] bg-[#d8efe9] px-4 py-3 text-sm text-gray-900 dark:border-[#486f66] dark:bg-[#15342e] dark:text-gray-100'
    >
      <div className='mx-auto flex max-w-5xl items-start gap-3'>
        <div className='min-w-0 flex-1 [&_a]:underline [&_p]:m-0'>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
        <Button
          aria-label='Dismiss announcement'
          className='h-8 w-8 shrink-0'
          onClick={handleDismiss}
          size='icon'
          type='button'
          variant='ghost'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </section>
  )
}
