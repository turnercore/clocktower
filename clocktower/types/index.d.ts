// UUID type imported from 'crypto' library
import type { UUID as CryptoUUID } from 'crypto'

export interface TowerData { 
  id: UUID
  name?: string
  users: UUID[]
}

export interface TowerInitialData extends TowerData {
  rows: TowerRowInitialData[]
}

export interface TowerRowData {
  id: UUID
  tower_id: UUID
  name?: string
  position: number
  users: UUID[]
}

export interface TowerRowInitialData extends TowerRowData {
  clocks: ClockData[]
}

// Define a type for the clock data
export interface ClockData {
  id: UUID
  row_id: UUID
  tower_id: UUID
  name: string
  segments: number
  filled: number | null
  rounded: boolean
  line_width: number
  lighten_intensity: number
  darken_intensity: number
  position: number
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

export interface ColorPaletteItem {
  clocksUsing: UUID[]
  hex: string
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
  full_name?: string
  icon: string
  icon_color: string
  color: string
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