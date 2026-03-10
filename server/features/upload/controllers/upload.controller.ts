import type { Request, Response } from 'express'
import * as imageService from '../../../shared/services/image.service'

export async function uploadImage(req: Request, res: Response) {
  try {
    const contentType = req.headers['content-type'] ?? ''

    if (!contentType.startsWith('image/')) {
      res.status(400).json({ error: 'Only image files are accepted' })
      return
    }

    const buffer = req.body as Buffer

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      res.status(400).json({ error: 'Empty file' })
      return
    }

    const key = await imageService.upload(buffer, contentType)
    const url = imageService.getPublicUrl(key)

    res.status(201).json({ url, key })
  } catch (err) {
    console.error('Upload failed:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
}
