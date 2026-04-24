import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import AnnouncementBannerClient from './AnnouncementBannerClient'

const announcementPath = path.join(process.cwd(), 'announcement.md')

export default async function AnnouncementBanner() {
  let markdown = ''

  try {
    markdown = (await fs.readFile(announcementPath, 'utf8')).trim()
  } catch {
    return null
  }

  if (!markdown) return null

  const announcementHash = crypto
    .createHash('sha256')
    .update(markdown)
    .digest('hex')
    .slice(0, 16)

  return (
    <AnnouncementBannerClient
      announcementHash={announcementHash}
      markdown={markdown}
    />
  )
}
