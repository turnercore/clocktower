import { z } from 'zod'
import type { UUID as CryptoUUID } from 'crypto'
import type { Database } from './supabase'

// Create TowerSchema based on the Database type of the towers table
import { z } from 'zod'

export const ProfileRowSchema = z.object({
  bg_color: z.string().nullable(),
  full_name: z.string().nullable(),
  icon: z.string().nullable(),
  icon_color: z.string().nullable(),
  id: z.string(),
  username: z.string().nullable(),
})

export type ProfileRow = z.infer<typeof ProfileRowSchema>

export const ProfileSchema = z.extend(ProfileRowSchema, {
  friends: z.array(UUIDSchema).optional(),
})

export type Profile = z.infer<typeof ProfileSchema>

export const FriendRowSchema = z.object({
  friend_id: UUIDSchema,
  user_id: UUIDSchema,
})

export type FriendRow = z.infer<typeof FriendRowSchema>

export const FriendsListSchema = z.array(UUIDSchema)

export type FriendsList = z.infer<typeof FriendsListSchema>
// TowerData Schema and Type
export const TowerDataSchema = z.object({
  id: UUIDSchema,
  name: z.string().optional(),
  users: z.array(UUIDSchema),
  colors: z.array(HexColorCodeSchema),
  created_at: z.date().optional(),
})

export type TowerData = z.infer<typeof TowerRowSchema>

export const TowerSchema = z.extend(TowerDataSchema, {
  rows: z.array(TowerRowSchema),
})

export type Tower = z.infer<typeof TowerSchema>

export const TowerRowRowSchema = z.object({
  id: UUIDSchema,
  name: z.string().nullable(),
  tower_id: UUIDSchema,
  position: z.number().min(0).default(0),
  users: z.array(UUIDSchema).nullable(),
  created_at: z.string().optional(),
})

export type TowerRowRow = z.infer<typeof TowerRowRow>

export const TowerRowSchema = z.extend(TowerRowRowSchema, {
  clocks: z.array(ClockSchema),
})

export type TowerRow = z.infer<typeof TowerRowSchema>

// This is just a join table for towers and users
export const TowersUsersRowSchema = z.object({
  created_at: z.string(),
  tower_id: z.string(),
  user_id: z.string(),
})

export type TowersUsersRow = z.infer<typeof TowersUsersRowSchema>

export const ClockRowSchema = z.object({
  id: UUIDSchema,
  name: z.coerce
    .string()
    .trim()
    .max(30, { message: 'Name is too long.' })
    .default(''),
  segments: z.number(),
  color: HexColorCodeSchema.default('#FFA500'),
  filled: z.number().nullable(),
  rounded: z.boolean(),
  line_width: z.number(),
  darken_intensity: z.number(),
  lighten_intensity: z.number(),
  tower_id: UUIDSchema,
  row_id: UUIDSchema,
  position: z.number().default(0),
  users: z.array(UUIDSchema).default([]),
  created_at: z.date().optional(),
})

export type ClockRowData = z.infer<typeof ClockRowDataSchema>

export const ClockSchema = ClockRowSchema

export type Clock = z.infer<typeof ClockSchema>

// UUID Schema and Type
export const UUIDSchema = z.string().uuid()
export type UUID = z.infer<typeof UUIDSchema>

// HexColorCode Schema and Type
export const HexColorCodeSchema = z
  .string()
  .regex(/^#([0-9a-f]{3}){1,2}$/i)
  .trim()
export type HexColorCode = z.infer<typeof HexColorCodeSchema>

// User Schema and Type
export const UserSchema = z.object({
  id: UUIDSchema,
  email: z.string().email(),
  provider: z.string().optional(),
  created_at: z.instanceof(Date).optional(),
  last_sign_in: z.instanceof(Date).optional(),
})
export type User = z.infer<typeof UserSchema>

// ColorPaletteItem Schema and Type
export const ColorPaletteItemSchema = z.object({
  clocksUsing: z.array(UUIDSchema),
  hex: z.string(),
})
export type ColorPaletteItem = z.infer<typeof ColorPaletteItemSchema>

//--- Prop Types ---\\
// {} [1100jli1b0O]
export const EntityWithPositionEnum = z.enum(['row', 'clock'])
export type EntityWithPosition = z.infer<typeof EntityWithPositionEnum>

// Now, using EntityTypeSchema in your other schemas
export const UpdateAndSyncPositionParamsSchema = z.object({
  entityType: EntityWithPositionEnum,
  entities: z.array(z.union([TowerRowDataSchema, ClockDataSchema])),
})

// Infer the type from the schema
export type UpdateAndSyncPositionParams = z.infer<
  typeof UpdateAndSyncPositionSchema
>

// Server Action Error return type
export const ServerActionErrorSchema = z
  .object({
    error: z.string(),
  })
  .passthrough()

export type ServerActionError = z.infer<typeof ServerActionErrorSchema>
