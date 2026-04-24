import { openaiModeration } from './openaiModeration'

describe('openaiModeration', () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY
  const originalFetch = globalThis.fetch
  let fetchMock: jest.Mock
  let consoleErrorSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    fetchMock = jest.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalOpenAiKey === undefined) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiKey
    }

    globalThis.fetch = originalFetch
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('returns false for a clean input without calling the live API', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ results: [{ flagged: false }] }),
    })

    const formData = new FormData()
    formData.append('input', 'This is a clean input.')

    const result = await openaiModeration(formData)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/moderations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-openai-key',
        }),
        body: JSON.stringify({ input: 'This is a clean input.' }),
      }),
    )
    expect(result).toEqual({ data: false })
  })

  it('returns true for a flagged input without calling the live API', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ results: [{ flagged: true }] }),
    })

    const formData = new FormData()
    formData.append('input', 'Fuck shit kill me asshole')

    const result = await openaiModeration(formData)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: true })
  })

  it('returns the validation error when the input is missing', async () => {
    const formData = new FormData()

    const result = await openaiModeration(formData)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      error: 'input Errors: Required',
    })
  })
})
