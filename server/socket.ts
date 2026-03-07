import { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { verifyToken } from './shared/utils/jwt'

export let io: SocketServer

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'))
    }
    try {
      const payload = verifyToken(token)
      ;(socket as SocketWithUser).userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: SocketWithUser) => {
    const userId = socket.userId
    if (userId) {
      socket.join(`user:${userId}`)
    }

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })
  })

  return io
}

export function emitNewMessage(conversationId: string, message: Record<string, unknown>) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('new_message', message)
  }
}

interface SocketWithUser {
  userId?: string
}
