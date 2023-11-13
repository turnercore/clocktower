import { z } from 'zod'
import { generateUsername } from '@/tools/generateUsername'

// UUID Schema and Type
export const UUIDSchema = z.string().uuid()
export type UUID = z.infer<typeof UUIDSchema>

// HexColorCode Schema and Type
export const HexColorCodeSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}){1,2}$/i)
export type HexColorCode = z.infer<typeof HexColorCodeSchema>

export const ProfileRowSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable(),
    color: HexColorCodeSchema.nullable(),
    avatar_set: z.number().default(1),
  })
  .strip()

// ColorPaletteItem Schema and Type
export const ColorPaletteSchema = z.record(z.array(UUIDSchema)).refine(
  (obj) => {
    return Object.keys(obj).every(
      (key) => HexColorCodeSchema.safeParse(key).success,
    )
  },
  {
    message: 'All keys must be valid hex color codes',
  },
)
export type ColorPaletteType = z.infer<typeof ColorPaletteSchema>

export type ProfileRow = z.infer<typeof ProfileRowSchema>

export const ProfileSchema = ProfileRowSchema.extend({
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

export const ClockDatabaseSchema = z
  .object({
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
  .strip()

export type ClockRowData = z.infer<typeof ClockDatabaseSchema>

export const ClockSchema = ClockDatabaseSchema

export type ClockType = z.infer<typeof ClockSchema>

export const TowerRowRowSchema = z
  .object({
    id: UUIDSchema,
    name: z
      .string()
      .trim()
      .max(30, 'Max 30 characters in Tower Row name')
      .default(''),
    tower_id: UUIDSchema,
    position: z.number().min(0).default(0),
    users: z.array(UUIDSchema).nullable().default([]),
    color: HexColorCodeSchema.nullable().default('#FFA500'),
  })
  .strip()

export type TowerRowRow = z.infer<typeof TowerRowRowSchema>
// export type TowerRowRow = {
//   id: UUID
//   name: string
//   tower_id: UUID
//   position: number
//   users: UUID[]
//   color: HexColorCode
// }

export const TowerRowSchema = TowerRowRowSchema.extend({
  clocks: z.array(ClockSchema).default([]),
})

export type TowerRowType = z.infer<typeof TowerRowSchema>

// This is just a join table for towers and users
export const TowersUsersRowSchema = z
  .object({
    tower_id: z.string(),
    user_id: z.string(),
  })
  .strip()

export type TowersUsersRow = z.infer<typeof TowersUsersRowSchema>

// export type TowerDatabaseType = {
//   id: UUID
//   name: string
//   users: UUID[]
//   owner: UUID
//   colors: ColorPaletteItem[]
// }
// TowerData Schema and Type
export const TowerDatabaseSchema = z
  .object({
    id: UUIDSchema,
    name: z
      .string()
      .max(30, { message: 'Name is too long.' })
      .trim()
      .default(''),
    users: z.array(UUIDSchema).default([]),
    owner: UUIDSchema,
    colors: ColorPaletteSchema.nullable().default({}),
  })
  .strip()
export type TowerDatabaseType = z.infer<typeof TowerDatabaseSchema>

export const TowerSchema = z.object({
  id: UUIDSchema,
  name: z.string().trim().max(30, { message: 'Name is too long.' }).default(''),
  users: z.array(UUIDSchema),
  owner: UUIDSchema,
  colors: ColorPaletteSchema.nullable().default({}),
  rows: z.array(TowerRowSchema).nullable().default([]),
})

// Extend towerdatabse to add rows
// export type TowerType = TowerDatabaseType & {
//   rows: TowerRowType[]
// }
export type TowerType = z.infer<typeof TowerSchema>

// User Schema and Type TODO:
export const UserSchema = z.object({
  id: UUIDSchema,
  email: z.string().email().optional(),
  provider: z.string().optional(),
  last_sign_in: z.instanceof(Date).optional(),
  username: z.string().default(generateUsername()),
  icon: z.string().nullable().default('D20'),
  icon_color: HexColorCodeSchema.nullable().default('#000000'),
  bg_color: HexColorCodeSchema.nullable().default('#FFFFFF'),
})
export type UserType = z.infer<typeof UserSchema>

//--- Prop Types ---\\
// {} [1100jli1b0O]
export const EntityWithPositionEnum = z.enum(['row', 'clock'])
export type EntityWithPosition = z.infer<typeof EntityWithPositionEnum>

// Now, using EntityTypeSchema in your other schemas
export const UpdateAndSyncPositionParamsSchema = z.object({
  entityType: EntityWithPositionEnum,
  entities: z.array(z.union([TowerRowSchema, ClockSchema])),
})

// Define the type from the Schema, infer failed
export type UpdateAndSyncPositionParams = {
  entityType: EntityWithPosition
  entities: SortableEntity[]
}

// Server Action Error return type
export const ServerActionErrorSchema = z.object({
  error: z.string(),
})

export type ServerActionError = z.infer<typeof ServerActionErrorSchema>

// Define a generic function to create a schema for server action returns:
export const ServerActionReturnSchema = <T extends z.ZodType<any, any>>(
  schema: T,
) =>
  z.union([
    ServerActionErrorSchema,
    z.object({ data: z.union([schema, z.array(schema)]) }),
  ])

export type ServerActionReturn<T> = {
  error?: string
  data?: T
}

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

export type UserPresence = {
  online: boolean
  lastSeen: string // ISO date string
  // You can add more user-specific presence information here
}

// Realtime Presence
export type PresencePayload = {
  id: UUID
  presence: UserPresence
}
