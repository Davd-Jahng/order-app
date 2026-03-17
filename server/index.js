const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const { pool } = require('./db/pool')

const app = express()
const PORT = process.env.PORT || 3000

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})
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

// 메뉴 목록 + 옵션 + 재고
app.get('/api/menus', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        m.id,
        m.name,
        m.description,
        m.price,
        m.image,
        m.stock,
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'name', o.name,
              'extraPrice', o.extra_price
            )
          ) FILTER (WHERE o.id IS NOT NULL),
          '[]'
        ) AS options
      FROM menus m
      LEFT JOIN options o ON o.menu_id = m.id
      GROUP BY m.id
      ORDER BY m.id ASC
      `
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/menus:', err)
    res.status(500).json({ ok: false, message: '메뉴를 불러오지 못했습니다.' })
  }
})

// 재고 증감 (관리자 화면)
app.patch('/api/menus/:id/stock', async (req, res) => {
  const id = Number(req.params.id)
  const { delta } = req.body || {}
  if (!Number.isFinite(id) || !Number.isFinite(delta)) {
    return res.status(400).json({ ok: false, message: '잘못된 요청입니다.' })
  }
  try {
    const { rows } = await pool.query(
      `
      UPDATE menus
      SET stock = GREATEST(0, stock + $1)
      WHERE id = $2
      RETURNING *
      `,
      [delta, id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: '메뉴를 찾을 수 없습니다.' })
    }
    res.json({ ok: true, menu: rows[0] })
  } catch (err) {
    console.error('PATCH /api/menus/:id/stock:', err)
    res.status(500).json({ ok: false, message: '재고를 변경하지 못했습니다.' })
  }
})

// 주문 전체 조회 (관리자 화면)
app.get('/api/orders', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        o.id,
        o.created_at,
        o.status,
        COALESCE(SUM(oi.amount), 0) AS total,
        COALESCE(
          json_agg(
            json_build_object(
              'productId', oi.menu_id,
              'productName', oi.menu_name,
              'optionName', oi.option_name,
              'quantity', oi.quantity,
              'unitPrice', CASE WHEN oi.quantity > 0 THEN oi.amount / oi.quantity ELSE oi.amount END
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.id DESC
      `
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/orders:', err)
    res.status(500).json({ ok: false, message: '주문 목록을 불러오지 못했습니다.' })
  }
})

// 주문 생성 (주문하기 화면)
app.post('/api/orders', async (req, res) => {
  const { items } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: '주문 항목이 비어 있습니다.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const orderResult = await client.query(
      `INSERT INTO orders (status) VALUES ('주문접수') RETURNING id, created_at, status`
    )
    const order = orderResult.rows[0]

    for (const item of items) {
      const { productId, productName, optionNames, quantity, unitPrice } = item
      const amount = Number(unitPrice) * Number(quantity)
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          menu_id,
          menu_name,
          option_name,
          quantity,
          amount
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          order.id,
          productId,
          productName,
          Array.isArray(optionNames) ? optionNames.join(', ') : optionNames || null,
          quantity,
          amount,
        ]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ ok: true, orderId: order.id })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST /api/orders:', err)
    res.status(500).json({ ok: false, message: '주문을 생성하지 못했습니다.' })
  } finally {
    client.release()
  }
})

// 주문 상태 변경 + 제조완료 시 재고 차감
app.patch('/api/orders/:id/status', async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body || {}
  if (!Number.isFinite(id) || typeof status !== 'string') {
    return res.status(400).json({ ok: false, message: '잘못된 요청입니다.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const currentRes = await client.query('SELECT status FROM orders WHERE id = $1', [id])
    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ ok: false, message: '주문을 찾을 수 없습니다.' })
    }
    const currentStatus = currentRes.rows[0].status

    await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id])

    if (status === '제조완료' && currentStatus !== '제조완료') {
      const { rows: items } = await client.query(
        `
        SELECT menu_id, quantity
        FROM order_items
        WHERE order_id = $1
        `,
        [id]
      )
      for (const item of items) {
        await client.query(
          `
          UPDATE menus
          SET stock = GREATEST(0, stock - $1)
          WHERE id = $2
          `,
          [item.quantity, item.menu_id]
        )
      }
    }

    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('PATCH /api/orders/:id/status:', err)
    res.status(500).json({ ok: false, message: '주문 상태를 변경하지 못했습니다.' })
  } finally {
    client.release()
  }
})

async function bootstrap() {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    await pool.query(schemaSql)
    console.log('Database schema is ready.')

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM menus')
    if (rows[0].count === 0) {
      const defaultMenus = [
        {
          name: '아메리카노(HOT)',
          price: 4000,
          description: '따뜻한 에스프레소에 뜨거운 물을 더한 클래식 커피',
          image: '/images/americano-hot.jpg',
          stock: 10,
        },
        {
          name: '아메리카노(ICE)',
          price: 4000,
          description: '시원한 에스프레소에 얼음과 물을 더한 커피',
          image: '/images/americano-ice.jpg',
          stock: 10,
        },
        {
          name: '카페라떼',
          price: 5000,
          description: '에스프레소와 스팀 밀크가 어우러진 부드러운 라떼',
          image: '/images/caffe-latte.jpg',
          stock: 10,
        },
      ]
      const defaultOptions = [
        { name: '샷 추가', extraPrice: 500 },
        { name: '시럽 추가', extraPrice: 0 },
      ]

      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        for (const menu of defaultMenus) {
          const menuRes = await client.query(
            `
            INSERT INTO menus (name, description, price, image, stock)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            `,
            [menu.name, menu.description, menu.price, menu.image, menu.stock]
          )
          const menuId = menuRes.rows[0].id
          for (const option of defaultOptions) {
            await client.query(
              `
              INSERT INTO options (name, extra_price, menu_id)
              VALUES ($1, $2, $3)
              `,
              [option.name, option.extraPrice, menuId]
            )
          }
        }
        await client.query('COMMIT')
        console.log('Default menu seed completed.')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    }
  } catch (err) {
    console.error('Failed to prepare database schema:', err.message)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

bootstrap()
