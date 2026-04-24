import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Clocktower',
}

export default function PrivacyPolicyPage() {
  return <LegalMarkdownPage fileName='privacy-policy.md' />
}
