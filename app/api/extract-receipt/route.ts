import Anthropic from '@anthropic-ai/sdk'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 })
  }

  let body: { imageBase64: string; mediaType: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { imageBase64, mediaType } = body

  // Normalize media type — HEIC/HEIF from iPhone is not supported by Anthropic
  const normalizedType = mediaType?.toLowerCase() ?? 'image/jpeg'
  if (normalizedType.includes('heic') || normalizedType.includes('heif')) {
    return Response.json({ error: 'HEIC format not supported. Please use the camera button directly (not photo library), or take a screenshot of your receipt.' }, { status: 415 })
  }

  const apiMediaType = SUPPORTED_TYPES.includes(normalizedType)
    ? normalizedType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    : 'image/jpeg'

  const client = new Anthropic()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: apiMediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Extract information from this receipt and respond with ONLY valid JSON in this exact format:
{
  "vendor": "store or supplier name",
  "amount": 123.45,
  "date": "YYYY-MM-DD",
  "description": "brief description of what was purchased"
}
If a field cannot be determined, use null for that field. Date must be in YYYY-MM-DD format or null.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return Response.json({ error: 'Could not parse receipt data from image' }, { status: 422 })
    }

    const data = JSON.parse(match[0])
    return Response.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `AI extraction failed: ${message}` }, { status: 500 })
  }
}
