import AdminDashboard from './AdminDashboard'
import AdminInventory from './AdminInventory'
import AdminOrderList from './AdminOrderList'

function AdminPage({ orders, inventory, menuItems, onInventoryAdjust, onOrderStatusChange }) {
  return (
    <main className="admin-page">
      <AdminDashboard orders={orders} />
      <AdminInventory
        menuItems={menuItems}
        inventory={inventory}
        onAdjust={onInventoryAdjust}
      />
      <AdminOrderList orders={orders} onStatusChange={onOrderStatusChange} />
    </main>
  )
}

export default AdminPage
