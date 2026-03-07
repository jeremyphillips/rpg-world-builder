import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { corsOptions } from './shared/config/cors'
import { requestLogger } from './shared/middleware/requestLogger'
import { errorHandler } from './shared/middleware/errorHandler'
import { registerAppRoutes } from './register-routes'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Trust proxy (needed when behind Vite dev proxy)
app.set('trust proxy', true)

// CORS
app.use(cors(corsOptions))
app.options('/*', (_req, res) => res.sendStatus(200))

// Cookie parsing
app.use(cookieParser())

// Body parsing
app.use(express.json())
app.use(express.raw({ type: 'image/*', limit: '10mb' }))

// Logging
app.use(requestLogger)

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, '../assets/uploads')))

// API routes
registerAppRoutes(app)

// Error handling (must be last)
app.use(errorHandler)

export default app
