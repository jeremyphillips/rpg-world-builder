import http from 'http'
import { env } from './shared/config/env'
import { connectDB } from './shared/config/mongo'
import app from './app'
import { initSocket } from './socket'

async function bootstrap() {
  await connectDB()

  const httpServer = http.createServer(app)
  initSocket(httpServer)

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`)
  })
}

bootstrap()
