/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import merchantRoutes from './routes/merchants.js'
import uploadRoutes from './routes/upload.js'
import userRoutes from './routes/users.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../dist')
  app.use(express.static(clientDistPath))
}

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/merchants', merchantRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/users', userRoutes)

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../dist')
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error.stack)
  res.status(500).json({
    success: false,
    message: error.message || 'Something went wrong!',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app

