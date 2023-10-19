// UUID type imported from 'crypto' library
import type { UUID as CryptoUUID } from 'crypto'


export type Tower = { 
  id: UUID
  name?: string
  rows: SortedRowData[]
  users: UUID[]
}

export interface SortedRowData {
  rowId: UUID;  // Changed from id to rowId
  position: number;
}

export type TowerRow = {
  id: UUID
  towerId: UUID
  name?: string
  towerId: UUID
  position: number
  clocks: UUID[]
  users: UUID[]
}

export interface SortedClockData {
  clockId: UUID
  position: number
}

// Define a type for the clock data
export type Clock = {
  id: UUID
  rowId: UUID
  towerId: UUID
  name: string
  segments: number
  selectedSliceIndex: number | null
  isRounded: boolean
  lineWidth: number
  lightenIntensity: number
  darkenIntensity: number
  color: string // Assuming color is a string
  users: UUID[]
}

// Re-exporting the UUID type for use in this file
export type UUID = CryptoUUID

export type User = {
    id: UUID
    email: string
    phone: string
    provider: string
    created_at: Date
    last_sign_in: Date
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE'

export type UserProfile = {
    id?: UUID
    name?: string
    email?: string
    username?: string
    full_name?: string
    avatar_url?: string
    website?: string
    stripe_customer_id?: string
    openai_tokens_used?: number
}

export interface ServerError {
    message: string
    status: number
}

export interface StandardResponse {
    error?: {
      message: string
      status: number
    }
    data?: any
  }

export interface Profile {
  id: UUID
  username: string
  full_name: string
  avatar_url: string
  website: string
  user_id: UUID
}

interface ProcessMarkdownOptions {
  overlap?: number
  tokenLimit?: number
  includeBreadcrumbs?: boolean
  removeDecorators?: boolean
  removeLinks?: boolean
  removeImages?: boolean
  removeCodeBlocks?: boolean
  removeBlockquotes?: boolean
  removeTables?: boolean
  removeLists?: boolean
  removeFootnotes?: boolean
  removeAbbreviations?: boolean
  removeEmojis?: boolean
}