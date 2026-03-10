import { env } from '../../../shared/config/env'

export async function getChatCompletion(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('OpenAI Error:', response.status, errorData)
    throw new Error(`OpenAI API error (${response.status})`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
