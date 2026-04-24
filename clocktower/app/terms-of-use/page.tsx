import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | Clocktower',
}

export default function TermsOfUsePage() {
  return <LegalMarkdownPage fileName='terms-of-use.md' />
}
