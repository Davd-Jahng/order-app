const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { Client } = require('pg')
const fs = require('fs')

const config = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
}

async function main() {
  const client = new Client({ ...config, database: 'postgres' })
  try {
    await client.connect()
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.PGDATABASE || 'cozy']
    )
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE ${process.env.PGDATABASE || 'cozy'}`)
      console.log('Database "cozy" created.')
    } else {
      console.log('Database "cozy" already exists.')
    }
  } catch (err) {
    console.error('Create database:', err.message)
    throw err
  } finally {
    await client.end()
  }

  const schemaClient = new Client({
    ...config,
    database: process.env.PGDATABASE || 'cozy',
  })
  try {
    await schemaClient.connect()
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf8')
    await schemaClient.query(sql)
    console.log('Tables created (menus, options, orders, order_items).')
  } catch (err) {
    console.error('Schema:', err.message)
    throw err
  } finally {
    await schemaClient.end()
  }

  console.log('DB init done.')
}

main().catch(() => process.exit(1))
