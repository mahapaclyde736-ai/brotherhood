import express, { json } from 'express'
import Cors from 'cors'
import session from 'express-session'
import dotenv from 'dotenv'
import process from 'node:process'

import { verifyConnection } from './db/connection.js'
import BasicRoute from './Routes/RouteController.js'

dotenv.config()

const server = express()
const port = Number(process.env.PORT || 4000)

server.use(
  Cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
)
server.use(json())
// Session configuration
const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('SESSION_SECRET is required in production. Set it in your environment.')
  process.exit(1)
}

// When running behind a proxy (e.g., nginx, cloud load balancer) in production,
// Express needs to trust the proxy so secure cookies work correctly.
if (process.env.NODE_ENV === 'production') {
  server.set('trust proxy', 1)
}

server.use(
  session({
    secret: sessionSecret || 'dev-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
)

server.use('/api', BasicRoute)

// Wait for the database to verify before the backend starts accepting requests.
async function startServer() {
  try {
    await verifyConnection()
    server.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  } catch (error) {
    // Stop startup immediately if the database connection is not available.
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
