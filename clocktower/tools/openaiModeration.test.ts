import { openaiModeration } from './openaiModeration'

describe('moderateSA', () => {
  const formData = new FormData()

  afterEach(() => {
    formData.delete('input')
  })

  it('should return true for a clean input', async () => {
    formData.append('input', 'This is a clean input.')
    const result = await openaiModeration(formData)
    expect(result.data).toEqual(false)
  })

  it('should return false for a toxic input', async () => {
    formData.append('input', 'Fuck shit kill me asshole')
    const result = await openaiModeration(formData)
    expect(result.data).toEqual(true)
  })

  it('should return an error if the input is missing', async () => {
    const result = await openaiModeration(formData)
    expect(result.error).toBe('input Errors: Required')
  })
})
