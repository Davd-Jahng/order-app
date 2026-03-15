import { ORDER_STATUSES, ORDER_BLOCK_COLORS } from '../../constants/orderStatus'
import { formatPrice, formatDate } from '../../utils/formatters'

function AdminOrderList({ orders, onStatusChange }) {
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const getNextAction = (status) => {
    const i = ORDER_STATUSES.indexOf(status)
    if (i < 0 || i >= ORDER_STATUSES.length - 1) return null
    return ORDER_STATUSES[i + 1]
  }

  return (
    <section className="admin-section admin-orders">
      <h2 className="admin-section__title">주문 현황</h2>
      {sorted.length === 0 ? (
        <p className="admin-orders__empty">주문이 없습니다.</p>
      ) : (
        <ul className="admin-orders__list">
          {sorted.map((order, orderIndex) => {
            const items = order.items || []
            if (items.length === 0) return null
            const nextAction = getNextAction(order.status)
            const blockColor = ORDER_BLOCK_COLORS[orderIndex % ORDER_BLOCK_COLORS.length]

            return (
              <li key={order.id} className="admin-order-block" style={{ backgroundColor: blockColor }}>
                {items.map((line, lineIndex) => {
                  const itemText = `${line.productName}${line.optionNames ? ` (${line.optionNames})` : ''} x ${line.quantity}`
                  const linePrice = (line.unitPrice ?? 0) * (line.quantity ?? 0)
                  const isFirst = lineIndex === 0
                  const isLast = lineIndex === items.length - 1
                  const isTotalRow = items.length === 1

                  return (
                    <div
                      key={`${order.id}-${lineIndex}`}
                      className={`admin-order-item ${isFirst ? 'admin-order-item--first' : ''} ${isLast ? 'admin-order-item--last' : ''} ${isTotalRow ? 'admin-order-item--total' : ''}`}
                    >
                      <span className="admin-order-item__time">
                        {isFirst ? formatDate(order.createdAt) : ''}
                      </span>
                      <span className="admin-order-item__desc">{itemText}</span>
                      <span className="admin-order-item__price">{formatPrice(isTotalRow ? order.total : linePrice)}</span>
                      {isTotalRow ? (
                        nextAction ? (
                          <button
                            type="button"
                            className="admin-order-item__btn"
                            onClick={() => onStatusChange(order.id, nextAction)}
                          >
                            {nextAction === '주문접수' ? '주문 접수' : nextAction}
                          </button>
                        ) : (
                          <span className="admin-order-item__done">{order.status}</span>
                        )
                      ) : (
                        <span className="admin-order-item__spacer" />
                      )}
                    </div>
                  )
                })}
                {items.length > 1 && (
                  <div className="admin-order-item admin-order-item--total">
                    <span className="admin-order-item__time" />
                    <span className="admin-order-item__desc">주문 합계</span>
                    <span className="admin-order-item__price">{formatPrice(order.total)}</span>
                    {nextAction ? (
                      <button
                        type="button"
                        className="admin-order-item__btn"
                        onClick={() => onStatusChange(order.id, nextAction)}
                      >
                        {nextAction === '주문접수' ? '주문 접수' : nextAction}
                      </button>
                    ) : (
                      <span className="admin-order-item__done">{order.status}</span>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default AdminOrderList
