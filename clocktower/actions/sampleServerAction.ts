'use server'

import { z } from 'zod'

export default async function serverActionOnFormData(formData: FormData) {
  // Get the form data into a javascript object
  const form = Object.fromEntries(formData.entries())
  // Validate input with zod by passing the form object to the schema
  const inputSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string().optional(),
    //.... continue
  })

  // Validate data
  const result = inputSchema.safeParse(form)
  if (!result.success) {
    return { error: result.error.message }
  }

  // If we get here, the data is valid and can be used exactly as you would expect
  // to use it in the rest of your server action.
}
