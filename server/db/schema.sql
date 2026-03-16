-- COZY 앱 DB 스키마 (PRD 기준)

-- 메뉴
CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image VARCHAR(500),
  stock INTEGER NOT NULL DEFAULT 0
);

-- 옵션 (메뉴와 연결)
CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  extra_price INTEGER NOT NULL DEFAULT 0,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE
);

-- 주문 (1건 = 1행, 상태만)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT '주문접수'
);

-- 주문 상세 (1주문 N항목)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES menus(id),
  menu_name VARCHAR(100),
  option_id INTEGER REFERENCES options(id),
  option_name VARCHAR(100),
  quantity INTEGER NOT NULL,
  amount INTEGER NOT NULL
);
