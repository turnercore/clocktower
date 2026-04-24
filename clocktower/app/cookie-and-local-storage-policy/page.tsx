import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie and Local Storage Policy | Clocktower',
}

export default function CookieAndLocalStoragePolicyPage() {
  return <LegalMarkdownPage fileName='cookie-and-local-storage-policy.md' />
}
