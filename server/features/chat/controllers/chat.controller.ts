import type { Request, Response } from 'express'
import { getChatCompletion } from '../services/openai.service'

export async function chatController(req: Request, res: Response) {
  const { prompt } = req.body

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' })
    return
  }

  try {
    const reply = await getChatCompletion(prompt)
    res.json({ reply })
  } catch (err) {
    console.error('Chat controller error:', err)
    res.status(500).json({ error: 'Something went wrong' })
  }
}
