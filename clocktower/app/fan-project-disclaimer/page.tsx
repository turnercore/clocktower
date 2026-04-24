import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fan Project Disclaimer | Clocktower',
}

export default function FanProjectDisclaimerPage() {
  return <LegalMarkdownPage fileName='fan-project-disclaimer.md' />
}
