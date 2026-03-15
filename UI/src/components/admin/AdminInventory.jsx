function AdminInventory({ menuItems, inventory, onAdjust }) {
  return (
    <section className="admin-section admin-inventory">
      <h2 className="admin-section__title">재고 현황</h2>
      <div className="admin-inventory__grid">
        {menuItems.map((item) => (
          <div key={item.id} className="admin-inventory-card">
            <p className="admin-inventory-card__title">
              <span className="admin-inventory-card__name">{item.name}</span>
              <span className="admin-inventory-card__stock">{inventory[item.id] ?? 0}개</span>
            </p>
            <div className="admin-inventory-card__controls">
              <button
                type="button"
                className="admin-inventory-card__btn"
                onClick={() => onAdjust(item.id, -1)}
                aria-label="재고 줄이기"
              >
                −
              </button>
              <button
                type="button"
                className="admin-inventory-card__btn"
                onClick={() => onAdjust(item.id, 1)}
                aria-label="재고 늘리기"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AdminInventory
