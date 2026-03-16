import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import MenuCard from './components/MenuCard'
import Cart from './components/Cart'
import AdminPage from './components/admin/AdminPage'
import './App.css'

function App() {
  const [view, setView] = useState('order')
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState({})
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('')
  const [orderErrorMessage, setOrderErrorMessage] = useState('')
  const completedOrderIdsRef = useRef(new Set())

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

  // 메뉴 및 재고 초기 로드
  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await fetch(`${API_BASE}/api/menus`)
        if (!res.ok) throw new Error('메뉴 조회 실패')
        const data = await res.json()
        setMenuItems(data)
        const inv = {}
        for (const m of data) {
          inv[m.id] = m.stock ?? 0
        }
        setInventory(inv)
      } catch (err) {
        console.error('메뉴 불러오기 오류:', err)
      }
    }
    fetchMenus()
  }, [API_BASE])

  useEffect(() => {
    completedOrderIdsRef.current = new Set(
      orders.filter((o) => o.status === '제조완료').map((o) => o.id)
    )
    // 초기 마운트 시 저장된 주문 기준으로만 ref 동기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 초기 주문 목록 로드 (관리자 화면용)
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${API_BASE}/api/orders`)
        if (!res.ok) throw new Error('주문 조회 실패')
        const data = await res.json()
        setOrders(
          data.map((o) => ({
            id: o.id,
            createdAt: o.created_at,
            items: (o.items || []).map((it) => ({
              productId: it.productId ?? it.menu_id,
              productName: it.productName ?? it.menu_name,
              optionNames: it.optionNames ?? it.optionName ?? '',
              quantity: it.quantity,
              unitPrice: it.unitPrice ?? (it.quantity ? it.amount / it.quantity : it.amount),
            })),
            total: o.total,
            status: o.status,
          }))
        )
      } catch (err) {
        console.error('주문 불러오기 오류:', err)
      }
    }
    fetchOrders()
  }, [API_BASE])

  useEffect(() => {
    if (!orderSuccessMessage && !orderErrorMessage) return
    const t = setTimeout(() => {
      setOrderSuccessMessage('')
      setOrderErrorMessage('')
    }, 3000)
    return () => clearTimeout(t)
  }, [orderSuccessMessage, orderErrorMessage])

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

  const handleOrder = async () => {
    if (cart.length === 0) return
    const currentCart = [...cart]

    // 제조완료가 아닌 주문(접수대기/주문접수/제조중)에서 차감될 예정인 상품별 수량
    const reservedByProduct = {}
    for (const order of orders) {
      if (order.status === '제조완료') continue
      for (const item of order.items ?? []) {
        const pid =
          item.productId ??
          menuItems.find((m) => m.name === item.productName || m.id === item.productId)?.id
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
        const menuItem = menuItems.find(
          (m) => String(m.id) === String(productId) || m.id === productId
        )
        insufficient.push({
          name: menuItem?.name ?? productId,
          need,
          available,
        })
      }
    }

    if (insufficient.length > 0) {
      const message =
        '다음 메뉴의 재고가 부족합니다. ' +
        insufficient
          .map(({ name, need, available }) => `${name}: 주문 ${need}개, 가용 재고 ${available}개`)
          .join(' / ') +
        ' (가용 재고 = 재고 현황 - 제조 완료 전 주문 건수)'
      setOrderErrorMessage(message)
      return
    }

    const total = currentCart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)
    const payload = {
      items: currentCart.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        optionNames: it.optionNames || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      total,
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('주문 생성 실패')
      const { orderId } = await res.json()

      const newOrder = {
        id: orderId,
        createdAt: new Date().toISOString(),
        items: currentCart.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          optionNames: it.optionNames || '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        total,
        status: '주문접수',
      }
      setOrders((prev) => [...prev, newOrder])
      setCart([])
      setOrderSuccessMessage('주문이 접수되었습니다.')
      setOrderErrorMessage('')
    } catch (err) {
      console.error('주문 오류:', err)
      setOrderErrorMessage('주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleInventoryAdjust = async (productId, delta) => {
    try {
      const res = await fetch(`${API_BASE}/api/menus/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      })
      if (!res.ok) throw new Error('재고 변경 실패')
      const { menu } = await res.json()
      setInventory((prev) => ({
        ...prev,
        [menu.id]: menu.stock ?? 0,
      }))
    } catch (err) {
      console.error('재고 조정 오류:', err)
      alert('재고를 변경하지 못했습니다.')
    }
  }

  const handleOrderStatusChange = async (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId)
    const alreadyDeducted = completedOrderIdsRef.current.has(orderId)
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('상태 변경 실패')

      if (
        newStatus === '제조완료' &&
        order?.items &&
        order.status !== '제조완료' &&
        !alreadyDeducted
      ) {
        completedOrderIdsRef.current.add(orderId)
        // 재고는 서버에서 차감되었으므로, 최신 메뉴 정보를 다시 가져온다.
        try {
          const resMenus = await fetch(`${API_BASE}/api/menus`)
          if (resMenus.ok) {
            const data = await resMenus.json()
            const inv = {}
            for (const m of data) {
              inv[m.id] = m.stock ?? 0
            }
            setInventory(inv)
            setMenuItems(data)
          }
        } catch (e) {
          console.error('재고 갱신 오류:', e)
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    } catch (err) {
      console.error('주문 상태 변경 오류:', err)
      alert('주문 상태를 변경하지 못했습니다.')
    }
  }

  return (
    <div className="app-root">
      <Header currentView={view} onNavigate={setView} />
      {view === 'order' && (
        <div className="order-page">
          <main className="order-main">
            <section className="menu-section">
              <div className="menu-grid">
                {menuItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    options={item.options ?? []}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </section>
            <Cart
              items={cart}
              onQuantityChange={updateQuantity}
              onOrder={handleOrder}
              successMessage={orderSuccessMessage}
              errorMessage={orderErrorMessage}
            />
          </main>
        </div>
      )}
      {view === 'admin' && (
        <AdminPage
          orders={orders}
          inventory={inventory}
          menuItems={menuItems}
          onInventoryAdjust={handleInventoryAdjust}
          onOrderStatusChange={handleOrderStatusChange}
        />
      )}
    </div>
  )
}

export default App
