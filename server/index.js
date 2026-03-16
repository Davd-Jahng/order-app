const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const { pool } = require('./db/pool')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/api/health', async (req, res) => {
  let db = 'disconnected'
  try {
    await pool.query('SELECT 1')
    db = 'connected'
  } catch (err) {
    console.error('DB health check:', err.message)
  }
  res.json({ ok: true, message: 'COZY API', database: db })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
