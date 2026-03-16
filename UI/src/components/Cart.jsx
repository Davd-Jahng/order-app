import { formatPrice } from '../utils/formatters'

function Cart({ items, onQuantityChange, onOrder, successMessage, errorMessage }) {
  const total = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)

  return (
    <section className="cart">
      <h2 className="cart__title">장바구니</h2>
      {(successMessage || errorMessage) && (
        <div
          className={`cart__toast ${
            errorMessage ? 'cart__toast--error' : 'cart__toast--success'
          }`}
          role="status"
          aria-live="polite"
        >
          {errorMessage || successMessage}
        </div>
      )}
      {items.length === 0 ? (
        <p className="cart__empty">장바구니가 비어 있습니다.</p>
      ) : (
        <>
          <ul className="cart__list">
            {items.map((it, i) => (
              <li key={`${it.productId}-${it.optionIds?.join(',') ?? ''}-${i}`} className="cart__item">
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

export default Cart
