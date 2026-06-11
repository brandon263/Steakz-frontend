import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  menuItem: { name: string };
  quantity: number;
}

interface Order {
  id: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
}

export default function ChefDashboard() {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    api.get('/chef/menu').then(res => setMenu(res.data)).catch(() => {});
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/chef/orders');
      setPendingOrders(res.data.filter((o: Order) => o.status === 'PENDING'));
      setPreparingOrders(res.data.filter((o: Order) => o.status === 'PREPARING'));
      setCompletedOrders(res.data.filter((o: Order) => o.status === 'DONE'));
    } catch (error) {
      console.error('Failed to load chef orders', error);
    } finally {
      setLoading(false);
    }
  };

  const startPreparing = async (orderId: number) => {
    try {
      await api.patch(`/chef/orders/${orderId}/start`);
      loadOrders();
    } catch (error) {
      alert('Failed to start preparing order.');
    }
  };

  const markDone = async (orderId: number) => {
    try {
      await api.patch(`/chef/orders/${orderId}/done`);
      loadOrders();
    } catch (error) {
      alert('Failed to mark order complete.');
    }
  };

  const deleteMenuItem = async (id: number) => {
    if (!confirm('Remove this menu item?')) return;
    try {
      await api.delete(`/chef/menu/${id}`);
      setMenu(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert('Failed to remove menu item.');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading kitchen board...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Chef Dashboard</h1>
        <p className="page-description">Branch kitchen management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{pendingOrders.length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{preparingOrders.length}</div>
          <div className="stat-label">Preparing</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedOrders.length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="kanban-board">
        <div className="kanban-column">
          <div className="kanban-header">⏳ Pending</div>
          <div className="kanban-items">
            {pendingOrders.length === 0 ? (
              <div className="empty-state">No pending orders</div>
            ) : (
              pendingOrders.map(order => (
                <div className="kanban-card" key={order.id}>
                  <div className="kanban-title">Order #{order.id}</div>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>{item.menuItem.name} × {item.quantity}</li>
                    ))}
                  </ul>
                  <button className="btn btn-primary btn-sm" onClick={() => startPreparing(order.id)}>
                    Start Cooking
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-header">🔥 Preparing</div>
          <div className="kanban-items">
            {preparingOrders.length === 0 ? (
              <div className="empty-state">No in-progress orders</div>
            ) : (
              preparingOrders.map(order => (
                <div className="kanban-card" key={order.id}>
                  <div className="kanban-title">Order #{order.id}</div>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>{item.menuItem.name} × {item.quantity}</li>
                    ))}
                  </ul>
                  <button className="btn btn-success btn-sm" onClick={() => markDone(order.id)}>
                    Mark Complete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-header">✅ Completed</div>
          <div className="kanban-items">
            {completedOrders.length === 0 ? (
              <div className="empty-state">No completed orders yet</div>
            ) : (
              completedOrders.map(order => (
                <div className="kanban-card" key={order.id}>
                  <div className="kanban-title">Order #{order.id}</div>
                  <span className="badge badge-done">Ready for delivery</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <h2>Menu Items</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {menu.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteMenuItem(item.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {menu.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  No menu items loaded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
