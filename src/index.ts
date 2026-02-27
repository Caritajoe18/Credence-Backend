import express from 'express'
import { setupVerificationRoutes } from './routes/verification'
import { cache } from './cache/redis.js'
import { generateApiKey, revokeApiKey, rotateApiKey, listApiKeys } from './services/apiKeys.js'
import { requireApiKey } from './middleware/apiKey.js'
import {
  createSlashRequest,
  submitVote,
  getSlashRequest,
  listSlashRequests,
  type SlashRequestStatus,
  type VoteChoice,
} from './services/governance/slashingVotes.js'
import { loadConfig } from './config/index.js'
import { createHealthRouter } from './routes/health.js'
import { createDefaultProbes } from './services/health/probes.js'
import bulkRouter from './routes/bulk.js'
import { createAdminRouter } from './routes/admin/index.js'
import { validate } from './middleware/validate.js'
import {
  trustPathParamsSchema,
  bondPathParamsSchema,
  attestationsPathParamsSchema,
  attestationsQuerySchema,
  createAttestationBodySchema,
} from './schemas/index.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

const config = loadConfig()
const healthProbes = createDefaultProbes()
app.use('/api/health', createHealthRouter(healthProbes))

// Setup verification routes
setupVerificationRoutes(app)

app.get('/api/trust/:address', validate({ params: trustPathParamsSchema }), (req, res) => {
  const { address } = req.params
  // Placeholder: in production, fetch from DB / reputation engine
  res.json({
    address,
    score: 0,
    bondedAmount: '0',
    bondStart: null,
    attestationCount: 0,
  })
})

app.get('/api/bond/:address', validate({ params: bondPathParamsSchema }), (req, res) => {
  const { address } = req.params
  res.json({
    address,
    bondedAmount: '0',
    bondStart: null,
    bondDuration: null,
    active: false,
  })
})

app.get(
  '/api/attestations/:address',
  validate({ params: attestationsPathParamsSchema, query: attestationsQuerySchema }),
  (req, res) => {
    const { address } = req.params
    const { limit = 10, offset = 0 } = req.query
    res.json({
      address,
      attestations: [],
      total: 0,
      limit,
      offset,
    })
  }
)

app.post('/api/attestations', requireApiKey, validate({ body: createAttestationBodySchema }), (req, res) => {
  res.status(201).json({ success: true, attestationId: 'att_1' })
})

// Bulk verification endpoint (Enterprise)
app.use('/api/bulk', bulkRouter)

// Admin API endpoints (requires admin role)
app.use('/api/admin', createAdminRouter())

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Credence API listening on http://localhost:${PORT}`)
  })
}

export { app }
export default app

