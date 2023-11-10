'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { type ServerActionReturn } from '@/types/schemas'
import { z } from 'zod'

const inputSchema = z.object({
  input: z.string().min(1, { message: 'Input is missing' }),
})

type ReturnType = boolean

const openaiKey = process.env.OPENAI_API_KEY
export const openaiModeration = async (
  formData: FormData,
): Promise<ServerActionReturn<ReturnType>> => {
  try {
    if (!openaiKey) throw new Error('OpenAI API key not set')
    // Get the form data into a javascript object
    const form = Object.fromEntries(formData.entries())

    // Validate data
    const result = inputSchema.parse(form)

    // If we get here, the data is valid and can be used exactly as you would expect
    // to use it in the rest of your server action.

    const { input } = result
    console.log('input', input)

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ input }),
    })

    const data = await response.json()
    console.log('data', data)

    // Check for flags
    const { flagged } = data.results[0]

    return { data: flagged }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
