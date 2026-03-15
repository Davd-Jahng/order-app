import { useState } from 'react'
import { MENU_ITEMS, OPTIONS } from './data/menu'
import './App.css'

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원'
}

function OrderHeader() {
  return (
    <header className="order-header">
      <h1 className="order-header__brand">COZY</h1>
      <nav className="order-header__nav">
        <span className="order-header__tab order-header__tab--active">주문하기</span>
        <a href="/admin" className="order-header__tab">관리자</a>
      </nav>
    </header>
  )
}

function MenuCard({ item, options, onAddToCart }) {
  const [selectedIds, setSelectedIds] = useState([])

  const toggleOption = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id))
  const unitPrice = item.price + selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0)
  const optionNames = selectedOptions.map((o) => o.name).join(', ')

  const handleAdd = () => {
    onAddToCart({
      productId: item.id,
      productName: item.name,
      optionIds: [...selectedIds].sort(),
      optionNames,
      unitPrice,
    })
    setSelectedIds([])
  }

  return (
    <article className="menu-card">
      <div className="menu-card__image">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <span>이미지</span>
        )}
      </div>
      <h2 className="menu-card__name">{item.name}</h2>
      <p className="menu-card__price">{formatPrice(item.price)}</p>
      <p className="menu-card__desc">{item.description}</p>
      <div className="menu-card__options">
        {options.map((opt) => (
          <label key={opt.id} className="menu-card__option">
            <input
              type="checkbox"
              checked={selectedIds.includes(opt.id)}
              onChange={() => toggleOption(opt.id)}
            />
            <span>
              {opt.name} ({opt.extraPrice > 0 ? `+${formatPrice(opt.extraPrice)}` : '+0원'})
            </span>
          </label>
        ))}
      </div>
      <button type="button" className="menu-card__btn" onClick={handleAdd}>
        담기
      </button>
    </article>
  )
}

function Cart({ items, onQuantityChange, onOrder }) {
  const total = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)

  return (
    <section className="cart">
      <h2 className="cart__title">장바구니</h2>
      {items.length === 0 ? (
        <p className="cart__empty">장바구니가 비어 있습니다.</p>
      ) : (
        <>
          <ul className="cart__list">
            {items.map((it, i) => (
              <li key={i} className="cart__item">
                <span className="cart__item-name">
                  {it.productName}
                  {it.optionNames ? ` (${it.optionNames})` : ''}
                </span>
                <div className="cart__item-qty">
                  <button
                    type="button"
                    className="cart__qty-btn"
                    onClick={() => onQuantityChange(i, -1)}
                    aria-label="수량 줄이기"
                  >
                    −
                  </button>
                  <span className="cart__qty-value">{it.quantity}</span>
                  <button
                    type="button"
                    className="cart__qty-btn"
                    onClick={() => onQuantityChange(i, 1)}
                    aria-label="수량 늘리기"
                  >
                    +
                  </button>
                </div>
                <span className="cart__item-price">
                  {formatPrice(it.unitPrice * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="cart__total">
            총 금액 <strong>{formatPrice(total)}</strong>
          </p>
          <button type="button" className="cart__order-btn" onClick={onOrder}>
            주문하기
          </button>
        </>
      )}
    </section>
  )
}

function App() {
  const [cart, setCart] = useState([])

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
    alert('주문이 접수되었습니다. (백엔드 연동 후 실제 전송)')
    setCart([])
  }

  return (
    <div className="order-page">
      <OrderHeader />
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
  )
}

export default App
