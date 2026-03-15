import { useState, useEffect, useRef } from 'react'
import { MENU_ITEMS, OPTIONS } from './data/menu'
import Header from './components/Header'
import MenuCard from './components/MenuCard'
import Cart from './components/Cart'
import AdminPage from './components/admin/AdminPage'
import './App.css'

const STORAGE_KEYS = { orders: 'cozy-orders', inventory: 'cozy-inventory' }

function getInitialInventory() {
  return MENU_ITEMS.reduce((acc, item) => {
    acc[item.id] = 10
    return acc
  }, {})
}

function loadStoredOrders() {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.orders)
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

function loadStoredInventory() {
  const defaults = getInitialInventory()
  try {
    const s = localStorage.getItem(STORAGE_KEYS.inventory)
    if (!s) return defaults
    const parsed = JSON.parse(s)
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

function App() {
  const [view, setView] = useState('order')
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState(loadStoredOrders)
  const [inventory, setInventory] = useState(loadStoredInventory)
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('')
  const completedOrderIdsRef = useRef(new Set())

  useEffect(() => {
    if (!orderSuccessMessage) return
    const t = setTimeout(() => setOrderSuccessMessage(''), 3000)
    return () => clearTimeout(t)
  }, [orderSuccessMessage])

  useEffect(() => {
    completedOrderIdsRef.current = new Set(
      orders.filter((o) => o.status === '제조완료').map((o) => o.id)
    )
    // 초기 마운트 시 저장된 주문 기준으로만 ref 동기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory))
  }, [inventory])

  const addToCart = (payload) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (it) =>
          it.productId === payload.productId &&
          it.optionIds.join(',') === payload.optionIds.join(',')
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [
        ...prev,
        {
          productId: payload.productId,
          productName: payload.productName,
          optionIds: payload.optionIds,
          optionNames: payload.optionNames,
          quantity: 1,
          unitPrice: payload.unitPrice,
        },
      ]
    })
  }

  const updateQuantity = (index, delta) => {
    setCart((prev) => {
      const next = [...prev]
      const item = next[index]
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) {
        next.splice(index, 1)
        return next
      }
      next[index] = { ...item, quantity: newQty }
      return next
    })
  }

  const handleOrder = () => {
    if (cart.length === 0) return
    const currentCart = [...cart]

    // 제조완료가 아닌 주문(접수대기/주문접수/제조중)에서 차감될 예정인 상품별 수량
    const reservedByProduct = {}
    for (const order of orders) {
      if (order.status === '제조완료') continue
      for (const item of order.items ?? []) {
        const pid = item.productId ?? MENU_ITEMS.find((m) => m.name === item.productName)?.id
        if (pid != null) {
          reservedByProduct[pid] = (reservedByProduct[pid] ?? 0) + (item.quantity ?? 0)
        }
      }
    }

    // 주문할 상품별 필요 수량
    const requiredByProduct = {}
    for (const it of currentCart) {
      requiredByProduct[it.productId] = (requiredByProduct[it.productId] ?? 0) + it.quantity
    }

    // 가용 재고 = 재고 현황 - 제조완료 전 주문에서 차감될 수량
    const insufficient = []
    for (const [productId, need] of Object.entries(requiredByProduct)) {
      const stock = inventory[productId] ?? 0
      const reserved = reservedByProduct[productId] ?? 0
      const available = Math.max(0, stock - reserved)
      if (available < need) {
        const menuItem = MENU_ITEMS.find((m) => m.id === productId)
        insufficient.push({
          name: menuItem?.name ?? productId,
          need,
          available,
        })
      }
    }

    if (insufficient.length > 0) {
      const message =
        '다음 메뉴의 재고가 부족합니다.\n\n' +
        insufficient
          .map(({ name, need, available }) => `· ${name}: 주문 ${need}개, 가용 재고 ${available}개`)
          .join('\n') +
        '\n\n(가용 재고 = 재고 현황 - 제조 완료 전 주문 건수)'
      alert(message)
      return
    }

    const total = currentCart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)
    const newOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      items: currentCart.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        optionNames: it.optionNames || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      total,
      status: '접수대기',
    }
    setOrders((prev) => [...prev, newOrder])
    setCart([])
    setOrderSuccessMessage('주문이 접수되었습니다.')
  }

  const handleInventoryAdjust = (productId, delta) => {
    setInventory((prev) => {
      const next = { ...prev }
      const current = next[productId] ?? 0
      const newVal = current + delta
      next[productId] = newVal < 0 ? 0 : newVal
      return next
    })
  }

  const handleOrderStatusChange = (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId)
    const alreadyDeducted = completedOrderIdsRef.current.has(orderId)
    if (
      newStatus === '제조완료' &&
      order?.items &&
      order.status !== '제조완료' &&
      !alreadyDeducted
    ) {
      completedOrderIdsRef.current.add(orderId)
      setInventory((prev) => {
        const next = { ...prev }
        for (const item of order.items) {
          const pid = item.productId ?? MENU_ITEMS.find((m) => m.name === item.productName)?.id
          if (pid != null) {
            const current = next[pid] ?? 0
            next[pid] = Math.max(0, current - item.quantity)
          }
        }
        return next
      })
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  return (
    <div className="app-root">
      <Header currentView={view} onNavigate={setView} />
      {view === 'order' && (
        <div className="order-page">
          {orderSuccessMessage && (
            <p className="order-success-toast" role="status" aria-live="polite">
              {orderSuccessMessage}
            </p>
          )}
          <main className="order-main">
            <section className="menu-section">
              <div className="menu-grid">
                {MENU_ITEMS.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    options={OPTIONS}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </section>
            <Cart
              items={cart}
              onQuantityChange={updateQuantity}
              onOrder={handleOrder}
            />
          </main>
        </div>
      )}
      {view === 'admin' && (
        <AdminPage
          orders={orders}
          inventory={inventory}
          menuItems={MENU_ITEMS}
          onInventoryAdjust={handleInventoryAdjust}
          onOrderStatusChange={handleOrderStatusChange}
        />
      )}
    </div>
  )
}

export default App
