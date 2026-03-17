const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const fs = require('fs')
const { Client } = require('pg')

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'cozy',
  })

  try {
    await client.connect()
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf8')
    await client.query(sql)
    console.log('Schema applied successfully.')
  } catch (err) {
    console.error('Failed to apply schema:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
