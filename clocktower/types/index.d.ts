import { z } from 'zod'
import type { UUID as CryptoUUID } from 'crypto'
import type { Database } from './supabase'

// Create TowerSchema based on the Database type of the towers table
import { z } from 'zod'

export const ProfileRowSchema = z.object({
  bg_color: z.string().nullable(),
  icon: z.string().nullable(),
  icon_color: z.string().nullable(),
  id: z.string(),
  username: z.string().nullable(),
  color: z.string().nullable(),
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
  name: z
    .string()
    .max(30, { message: 'Name is too long.' })
    .strip()
    .default(''),
  users: z.array(UUIDSchema),
  owner: UUIDSchema,
  colors: z.array(HexColorCodeSchema),
})

export type TowerData = z.infer<typeof TowerDataSchema>

export const TowerSchema = TowerDataSchema.extend({
  rows: z.array(TowerRowSchema).default([]),
})

export type Tower = z.infer<typeof TowerSchema>
// export type Tower = {
//   id: UUID
//   name: string
//   users: UUID[]
//   colors: HexColorCode[]
//   rows: TowerRow[]
//   owner: UUID
// }

export const TowerRowRowSchema = z.object({
  id: UUIDSchema,
  name: z.string().nullable(),
  tower_id: UUIDSchema,
  position: z.number().min(0).default(0),
  users: z.array(UUIDSchema).nullable(),
})

export type TowerRowRow = z.infer<typeof TowerRowRowSchema>

export const TowerRowSchema = TowerRowRowSchema.extend({
  clocks: z.array(ClockSchema),
})

export type TowerRow = z.infer<typeof TowerRowSchema>

// This is just a join table for towers and users
export const TowersUsersRowSchema = z.object({
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
})

export type ClockRowData = z.infer<typeof ClockRowSchema>

export const ClockSchema = ClockRowSchema

export type Clock = z.infer<typeof ClockSchema>

// UUID Schema and Type
export const UUIDSchema = z.string().uuid()
export type UUID = CryptoUUID

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

// Define the type from the Schema, infer failed
export type UpdateAndSyncPositionParams = {
  entityType: EntityWithPosition
  entities: (TowerRowData | ClockData)[]
}

// Server Action Error return type
export const ServerActionErrorSchema = z.object({
  error: z.string(),
})

export type ServerActionError = z.infer<typeof ServerActionErrorSchema>

// Define a generic function to create a schema for server action returns:
export const ServerActionReturnSchema = <T>() =>
  z.union([
    ServerActionErrorSchema,
    z.object({ data: z.any().or(z.array(z.any())) }).of(T),
  ])

// Now define a generic type based on the generic schema function:
export type ServerActionReturn<T> = z.infer<typeof ServerActionReturnSchema<T>>

// Schema for Sortable Entities (database objects with position filed)
export const SortableEntitySchema = z
  .object({
    id: UUIDSchema,
    position: z.number().default(100),
  })
  .passthrough()

// Sortable Entities
export type SortableEntity = {
  id: UUID
  position: number
  [key: string]: unknown
}
