'use client'

import { useTowerAccess } from './TowerAccessContext'
import { createClient } from '@/lib/supabase/client'
import { HexColorCodeSchema, ProfileRowSchema, UUID } from '@/types/schemas'
import type { RealtimeChannel } from '@supabase/supabase-js'
import React, { useEffect, useMemo, useRef, useState } from 'react'

const BROADCAST_INTERVAL_MS = 33
const CURSOR_STALE_MS = 3000
const LABEL_IDLE_DELAY_MS = 380
const LABEL_MOVE_DEADZONE_PX = 8
const POSITION_SMOOTHING = 0.18
const ANGLE_SMOOTHING = 0.22
const POINTER_DEFAULT_ANGLE = -(3 * Math.PI) / 4

type CursorProfile = {
  color: string
  username: string
}

type CursorBroadcast = {
  angle: number
  color: string
  sentAt: number
  userId: UUID
  username: string
  x: number
  y: number
}

type CursorState = CursorBroadcast & {
  displayAngle: number
  displayX: number
  displayY: number
  labelVisible: boolean
  lastMovementAt: number
  lastSeen: number
}

type ViewportSize = {
  height: number
  width: number
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

const normalizeAngleDelta = (angle: number) =>
  Math.atan2(Math.sin(angle), Math.cos(angle))

const sanitizeColor = (color: string | null | undefined) => {
  const parsedColor = HexColorCodeSchema.safeParse(color || '')
  return parsedColor.success ? parsedColor.data : '#FFFFFF'
}

const getViewportSize = (): ViewportSize => ({
  height: window.innerHeight || 1,
  width: window.innerWidth || 1,
})

const loadCursorProfile = async (
  userId: UUID,
): Promise<CursorProfile | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, color, avatar_set')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error(error || 'No profile found for cursor.')
    return null
  }

  const parsedProfile = ProfileRowSchema.safeParse(data)
  if (!parsedProfile.success) {
    console.error(parsedProfile.error)
    return null
  }

  return {
    color: sanitizeColor(parsedProfile.data.color),
    username: parsedProfile.data.username || 'Clocktower user',
  }
}

const MousePointerIcon = ({ color }: { color: string }) => (
  <svg
    aria-hidden='true'
    className='h-7 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z'
      fill={color}
      stroke={color}
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
    />
  </svg>
)

const RealtimeIconCursors = ({
  enabled,
  towerId,
}: {
  enabled: boolean
  towerId: UUID
}) => {
  const { currentUserId } = useTowerAccess()
  const [cursorProfile, setCursorProfile] = useState<CursorProfile | null>(
    null,
  )
  const [remoteCursors, setRemoteCursors] = useState<CursorState[]>([])
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    height: 1,
    width: 1,
  })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const cursorsRef = useRef<Map<UUID, CursorState>>(new Map())
  const lastBroadcastAtRef = useRef(0)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const latestPayloadRef = useRef<CursorBroadcast | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!currentUserId) {
      setCursorProfile(null)
      return
    }

    let isMounted = true
    loadCursorProfile(currentUserId).then((profile) => {
      if (isMounted) setCursorProfile(profile)
    })

    return () => {
      isMounted = false
    }
  }, [currentUserId])

  useEffect(() => {
    setViewportSize(getViewportSize())

    const handleResize = () => {
      setViewportSize(getViewportSize())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!enabled || !currentUserId) {
      cursorsRef.current.clear()
      setRemoteCursors([])
      return
    }

    const channel = supabase.channel(`tower_icon_cursors:${towerId}`, {
      config: {
        broadcast: { self: false },
      },
    })
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        const cursorPayload = payload as CursorBroadcast
        if (!cursorPayload?.userId || cursorPayload.userId === currentUserId) {
          return
        }

        const previousCursor = cursorsRef.current.get(cursorPayload.userId)
        const nextX = clamp01(cursorPayload.x)
        const nextY = clamp01(cursorPayload.y)
        const now = performance.now()
        const movementPx = previousCursor
          ? Math.hypot(
              (nextX - previousCursor.x) * viewportSize.width,
              (nextY - previousCursor.y) * viewportSize.height,
            )
          : LABEL_MOVE_DEADZONE_PX + 1
        const isMoving = movementPx > LABEL_MOVE_DEADZONE_PX
        const lastMovementAt = isMoving
          ? now
          : previousCursor?.lastMovementAt || now - LABEL_IDLE_DELAY_MS

        cursorsRef.current.set(cursorPayload.userId, {
          ...cursorPayload,
          color: sanitizeColor(cursorPayload.color),
          displayAngle:
            previousCursor?.displayAngle ?? cursorPayload.angle ?? 0,
          displayX: previousCursor?.displayX ?? nextX,
          displayY: previousCursor?.displayY ?? nextY,
          labelVisible: now - lastMovementAt >= LABEL_IDLE_DELAY_MS,
          lastMovementAt,
          lastSeen: now,
          username: cursorPayload.username || 'Clocktower user',
          x: nextX,
          y: nextY,
        })
      })
      .subscribe()

    return () => {
      channelRef.current = null
      channel.unsubscribe()
    }
  }, [currentUserId, enabled, supabase, towerId, viewportSize])

  useEffect(() => {
    if (!enabled || !currentUserId || !cursorProfile) return

    const broadcastPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return

      const lastPointer = lastPointerRef.current
      const dx = lastPointer ? event.clientX - lastPointer.x : 0
      const dy = lastPointer ? event.clientY - lastPointer.y : 0
      const moving = Math.abs(dx) + Math.abs(dy) > 0.5
      const angle = moving
        ? Math.atan2(dy, dx) - POINTER_DEFAULT_ANGLE
        : latestPayloadRef.current?.angle || 0

      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      latestPayloadRef.current = {
        angle,
        color: cursorProfile.color,
        sentAt: Date.now(),
        userId: currentUserId,
        username: cursorProfile.username,
        x: clamp01(event.clientX / Math.max(window.innerWidth, 1)),
        y: clamp01(event.clientY / Math.max(window.innerHeight, 1)),
      }

      const now = performance.now()
      if (now - lastBroadcastAtRef.current < BROADCAST_INTERVAL_MS) return
      lastBroadcastAtRef.current = now

      channelRef.current?.send({
        event: 'cursor_move',
        payload: latestPayloadRef.current,
        type: 'broadcast',
      })
    }

    window.addEventListener('pointermove', broadcastPointer, { passive: true })
    return () => {
      window.removeEventListener('pointermove', broadcastPointer)
      lastPointerRef.current = null
      latestPayloadRef.current = null
    }
  }, [currentUserId, cursorProfile, enabled])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      const now = performance.now()
      const nextCursors: CursorState[] = []

      cursorsRef.current.forEach((cursor, userId) => {
        if (now - cursor.lastSeen > CURSOR_STALE_MS) {
          cursorsRef.current.delete(userId)
          return
        }

        const displayX =
          cursor.displayX + (cursor.x - cursor.displayX) * POSITION_SMOOTHING
        const displayY =
          cursor.displayY + (cursor.y - cursor.displayY) * POSITION_SMOOTHING
        const displayAngle =
          cursor.displayAngle +
          normalizeAngleDelta(cursor.angle - cursor.displayAngle) *
            ANGLE_SMOOTHING
        const nextCursor = {
          ...cursor,
          displayAngle,
          displayX,
          displayY,
          labelVisible: now - cursor.lastMovementAt >= LABEL_IDLE_DELAY_MS,
        }

        cursorsRef.current.set(userId, nextCursor)
        nextCursors.push(nextCursor)
      })

      setRemoteCursors(nextCursors)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [enabled])

  if (!enabled || remoteCursors.length === 0) return null

  return (
    <div className='pointer-events-none fixed inset-0 z-10 overflow-hidden'>
      {remoteCursors.map((cursor) => (
        <div
          aria-label={`${cursor.username}'s cursor`}
          className='absolute left-0 top-0 h-0 w-0 will-change-transform'
          key={cursor.userId}
          role='img'
          style={{
            color: cursor.color,
            transform: `translate3d(${cursor.displayX * viewportSize.width}px, ${
              cursor.displayY * viewportSize.height
            }px, 0)`,
          }}
        >
          <div
            className='absolute left-0 top-0 origin-[4px_4px] drop-shadow-[0_0_2px_rgba(255,255,255,0.75)]'
            style={{
              transform: `translate(-4px, -4px) rotate(${cursor.displayAngle}rad)`,
            }}
          >
            <MousePointerIcon color={cursor.color} />
          </div>
          <span
            className={`absolute left-3 top-6 -translate-x-1/2 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium leading-none shadow-sm ring-1 ring-border transition-opacity duration-200 ${
              cursor.labelVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              color: cursor.color,
            }}
          >
            {cursor.username}
          </span>
        </div>
      ))}
    </div>
  )
}

export default RealtimeIconCursors
