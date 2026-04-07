import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  const body = await request.json()
  const { imageBase64, mediaType } = body

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
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

  // Extract JSON from the response
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    return Response.json({ error: 'Could not parse receipt' }, { status: 422 })
  }

  const data = JSON.parse(match[0])
  return Response.json(data)
}
