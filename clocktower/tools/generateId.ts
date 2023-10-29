import { UUID } from '@/types'
import { randomUUID } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

export default function generateUUID(): UUID {
  return randomUUID()
}
