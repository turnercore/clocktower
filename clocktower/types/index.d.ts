import { z } from "zod"
import type { UUID as CryptoUUID } from "crypto"

// UUID Schema and Type
export const UUIDSchema = z.string().uuid()
export type UUID = z.infer<typeof UUIDSchema>

// TowerData Schema and Type
export const TowerDataSchema = z.object({
  id: UUIDSchema,
  name: z.string().optional(),
  users: z.array(UUIDSchema),
})
export type TowerData = z.infer<typeof TowerDataSchema>

// HexColorCode Schema and Type
export const HexColorCodeSchema = z.string().regex(/^#([0-9a-f]{3}){1,2}$/i)
export type HexColorCode = z.infer<typeof HexColorCodeSchema>

// TowerRowData Schema and Type
export const TowerRowDataSchema = z.object({
  id: UUIDSchema,
  tower_id: UUIDSchema,
  name: z.string().optional(),
  position: z.number().default(0),
  users: z.array(UUIDSchema),
  colors: z.array(HexColorCodeSchema),
})
export type TowerRowData = z.infer<typeof TowerRowDataSchema>

// TowerRowInitialData Schema and Type
export const TowerRowInitialDataSchema = TowerRowDataSchema.extend({
  clocks: z.array(z.lazy(() => ClockDataSchema)),
})
export type TowerRowInitialData = z.infer<typeof TowerRowInitialDataSchema>

// TowerInitialData Schema and Type
export const TowerInitialDataSchema = TowerDataSchema.extend({
  rows: z.array(TowerRowInitialDataSchema),
})
export type TowerInitialData = z.infer<typeof TowerInitialDataSchema>

// ClockData Schema and Type
export const ClockDataSchema = z.object({
  id: UUIDSchema,
  row_id: UUIDSchema,
  tower_id: UUIDSchema,
  name: z.string(),
  segments: z.number(),
  filled: z.number().nullable(),
  rounded: z.boolean(),
  line_width: z.number(),
  lighten_intensity: z.number(),
  darken_intensity: z.number(),
  position: z.number(),
  color: z.string(),
  users: z.array(UUIDSchema),
})
export type ClockData = z.infer<typeof ClockDataSchema>

// User Schema and Type
export const UserSchema = z.object({
  id: UUIDSchema,
  email: z.string(),
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

// Profile Schema and Type
export const ProfileSchema = z.object({
  id: UUIDSchema,
  username: z.string(),
  full_name: z.string().optional(),
  icon: z.string(),
  icon_color: z.string(),
  color: z.string(),
})
export type Profile = z.infer<typeof ProfileSchema>

//--- Prop Types ---\\
// {} [1100jli1b0O]
export const EntityWithPositionEnum = z.enum(["row", "clock"])
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
