'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { z } from 'zod'
import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'

const inputSchema = z.object({
  inputUserId: UUIDSchema,
  inputInvitedUsername: z.string(),
  inputTowerId: UUIDSchema,
})

type ReturnType = {
  success: true
}

export default async function serverActionSA(
  input: z.infer<typeof inputSchema>,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    const {
      inputUserId: userId,
      inputInvitedUsername: username,
      inputTowerId: towerId,
    } = inputSchema.parse(input)
    const { body } = await inviteUserToTower({
      towerId,
      username,
      expectedUserId: userId,
    })
    if ('error' in body) return body
    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
