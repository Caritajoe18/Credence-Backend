import 'dotenv/config'
import app from './app.js'
import { createAdminRouter } from './routes/admin/index.js'
import governanceRouter from './routes/governance.js'
import disputesRouter from './routes/disputes.js'
import evidenceRouter from './routes/evidence.js'
import { loadConfig } from './config/index.js'

app.use('/api/admin', createAdminRouter())
app.use('/api/governance', governanceRouter)
app.use('/api/disputes', disputesRouter)
app.use('/api/evidence', evidenceRouter)

export { app }
export default app

if (process.env.NODE_ENV !== 'test') {
  try {
    const config = loadConfig()

    app.listen(config.port, () => {
      console.log(`Credence API listening on port ${config.port}`)
    })
  } catch (error) {
    console.error('Failed to start Credence API:', error)
    process.exit(1)
  }
}
