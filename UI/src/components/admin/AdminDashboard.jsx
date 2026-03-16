import { useState, useEffect, useRef } from 'react'
import { ORDER_STATUSES } from '../../constants/orderStatus'
import { formatPrice } from '../../utils/formatters'

function AdminDashboard({ orders }) {
  const [showSalesModal, setShowSalesModal] = useState(false)
  const salesButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (showSalesModal) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      closeButtonRef.current?.focus()
      const focusReturnTarget = salesButtonRef.current
      return () => {
        document.body.style.overflow = prev
        focusReturnTarget?.focus()
      }
    }
  }, [showSalesModal])

  const handleModalKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSalesModal(false)
      return
    }
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const list = [...focusable]
    if (list.length === 0) return
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const counts = ORDER_STATUSES.reduce((acc, status) => {
    const ordersByStatus = orders.filter((o) => o.status === status)
    acc[status] = ordersByStatus.reduce(
      (sum, o) =>
        sum + (o.items ?? []).reduce((s, item) => s + (item.quantity ?? 0), 0),
      0
    )
    return acc
  }, {})

  const totalCups = orders.reduce(
    (sum, o) => sum + (o.items ?? []).reduce((s, item) => s + (item.quantity ?? 0), 0),
    0
  )

  const totalSales = orders
    .filter((o) => o.status === '제조완료')
    .reduce((sum, o) => sum + (o.total ?? 0), 0)

  return (
    <section className="admin-section admin-dashboard">
      <h2 className="admin-section__title">관리자 대시보드</h2>
      <div className="admin-dashboard__row">
        <p className="admin-dashboard__summary">
          총 주문 {totalCups} / 주문 접수 {counts['주문접수']} / 제조 중 {counts['제조중']} / 제조 완료 {counts['제조완료']}
        </p>
        <button
          ref={salesButtonRef}
          type="button"
          className="admin-dashboard__sales-btn"
          onClick={() => setShowSalesModal(true)}
        >
          총매출
        </button>
      </div>
      {showSalesModal && (
        <div
          className="admin-sales-modal-overlay"
          onClick={() => setShowSalesModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowSalesModal(false)}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="admin-sales-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleModalKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-modal-title"
          >
            <h3 id="sales-modal-title" className="admin-sales-modal__title">총 매출</h3>
            <p className="admin-sales-modal__amount">{formatPrice(totalSales)}</p>
            <p className="admin-sales-modal__note">제조 완료된 주문 기준</p>
            <button
              ref={closeButtonRef}
              type="button"
              className="admin-sales-modal__close"
              onClick={() => setShowSalesModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminDashboard
