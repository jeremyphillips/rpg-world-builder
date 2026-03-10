import type { Request, Response } from 'express'
import * as userService from '../services/user.service'

const VALID_ROLES = ['superadmin', 'admin', 'user'] as const

export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await userService.getAllUsersWithCounts()
    res.json({ users })
  } catch (err) {
    console.error('Failed to get users:', err)
    res.status(500).json({ error: 'Failed to load users' })
  }
}

export async function getUser(req: Request, res: Response) {
  const user = await userService.getUserById(req.params.id)

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json({ user })
}

export async function updateRole(req: Request, res: Response) {
  const { role } = req.body

  if (!role || !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `Role must be one of: ${VALID_ROLES.join(', ')}` })
    return
  }

  const user = await userService.updateUserRole(req.params.id, role)

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json({ user })
}

export async function createUser(req: Request, res: Response) {
  try {
    const { username, email, password, role } = req.body

    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email, and password are required' })
      return
    }

    const validRole = VALID_ROLES.includes(role) ? role : 'user'

    const user = await userService.createUser({ username, email, password, role: validRole })
    res.status(201).json({ user })
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: 'A user with that email or username already exists' })
      return
    }
    console.error('Failed to create user:', err)
    res.status(500).json({ error: 'Failed to create user' })
  }
}
