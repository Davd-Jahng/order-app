const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'cozy',
})

// UI/src/data/menu.js 와 동일한 기본 메뉴/옵션
const MENUS = [
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

const OPTIONS = [
  { name: '샷 추가', extra_price: 500 },
  { name: '시럽 추가', extra_price: 0 },
]

async function main() {
  const client = await pool.connect()
  try {
    console.log('Seeding menus and options...')

    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM menus')
    if (rows[0].count > 0) {
      console.log('menus 테이블에 이미 데이터가 있어, 시드를 건너뜁니다.')
      return
    }

    await client.query('BEGIN')

    const menuIdMap = {}
    for (const m of MENUS) {
      const res = await client.query(
        `
        INSERT INTO menus (name, description, price, image, stock)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [m.name, m.description, m.price, m.image, m.stock]
      )
      menuIdMap[m.name] = res.rows[0].id
    }

    for (const [menuName, menuId] of Object.entries(menuIdMap)) {
      for (const opt of OPTIONS) {
        await client.query(
          `
          INSERT INTO options (name, extra_price, menu_id)
          VALUES ($1, $2, $3)
          `,
          [opt.name, opt.extra_price, menuId]
        )
      }
    }

    await client.query('COMMIT')
    console.log('Seed 완료: menus, options')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed 실패:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()

