function Header({ currentView, onNavigate }) {
  return (
    <header className="order-header">
      <h1 className="order-header__brand">COZY</h1>
      <nav className="order-header__nav">
        <button
          type="button"
          className={`order-header__tab ${currentView === 'order' ? 'order-header__tab--active' : ''}`}
          onClick={() => onNavigate('order')}
        >
          주문하기
        </button>
        <button
          type="button"
          className={`order-header__tab ${currentView === 'admin' ? 'order-header__tab--active' : ''}`}
          onClick={() => onNavigate('admin')}
        >
          관리자
        </button>
      </nav>
    </header>
  )
}

export default Header
