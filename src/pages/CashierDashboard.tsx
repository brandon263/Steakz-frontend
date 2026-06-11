import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  customer?: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

interface Booking {
  id: number;
  date: string;
  guestCount: number;
  status: string;
  customer: { name: string };
  table: { tableNumber: number };
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
}

interface CartItem {
  menuItemId: number;
  name: string;
  quantity: number;
  price: number;
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'create'>('create');
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadOrders(), loadBookings(), loadMenu()]);
    setLoading(false);
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/cashier/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to load orders', error);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/cashier/bookings');
      setBookings(res.data);
    } catch (error) {
      console.error('Failed to load bookings', error);
    }
  };

  const loadMenu = async () => {
    try {
      const res = await api.get('/cashier/menu');
      setMenu(res.data);
    } catch (error) {
      console.error('Failed to load menu', error);
    }
  };

  const deliverOrder = async (id: number) => {
    try {
      await api.patch(`/cashier/orders/${id}/deliver`);
      await loadOrders();
    } catch (error) {
      alert('Failed to mark as delivered');
    }
  };

  const confirmBooking = async (bookingId: number) => {
    try {
      await api.patch(`/cashier/bookings/${bookingId}/confirm`);
      await loadBookings();
      setOrderSuccess('Booking confirmed successfully.');
      setTimeout(() => setOrderSuccess(''), 2500);
    } catch (error) {
      alert('Failed to confirm booking.');
    }
  };

  const rejectBooking = async (bookingId: number) => {
    try {
      await api.patch(`/cashier/bookings/${bookingId}/reject`);
      await loadBookings();
      setOrderSuccess('Booking rejected successfully.');
      setTimeout(() => setOrderSuccess(''), 2500);
    } catch (error) {
      alert('Failed to reject booking.');
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, price: item.price }];
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity < 1) {
      setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
      return;
    }
    setCart(prev => prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity } : c));
  };

  const submitOrder = async () => {
    setOrderError('');
    if (cart.length === 0) {
      setOrderError('Add at least one menu item to the order.');
      return;
    }
    try {
      await api.post('/cashier/orders', {
        bookingId: selectedBookingId,
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
      });
      setCart([]);
      setSelectedBookingId(null);
      setOrderSuccess('Order created successfully.');
      await loadOrders();
      await loadBookings();
      setActiveTab('orders');
      setTimeout(() => setOrderSuccess(''), 2500);
    } catch (error: any) {
      setOrderError(error.response?.data?.error || 'Failed to create order.');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading cashier dashboard...</div>
      </div>
    );
  }

  const readyOrders = orders.filter(o => o.status === 'DONE');
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Cashier Dashboard</h1>
        <p className="page-description">Create branch orders, confirm bookings, and deliver completed meals</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{readyOrders.length}</div>
          <div className="stat-label">Ready for Delivery</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{deliveredOrders.length}</div>
          <div className="stat-label">Delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalSales.toFixed(2)}</div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: '1.5rem' }}>
        <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('orders')}>
          Orders
        </button>
        <button className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('bookings')}>
          Bookings ({bookings.length})
        </button>
        <button className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('create')}>
          Create Order
        </button>
      </div>

      {orderSuccess && <div className="alert alert-success">{orderSuccess}</div>}
      {orderError && <div className="alert alert-error">{orderError}</div>}

      {activeTab === 'orders' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Order Queue</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>No orders found</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer?.name || 'Walk-in'}</td>
                      <td>{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</td>
                      <td>${order.total.toFixed(2)}</td>
                      <td><span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
                      <td>
                        {order.status === 'DONE' && (
                          <button className="btn btn-primary btn-sm" onClick={() => deliverOrder(order.id)}>
                            Deliver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="card-grid">
          {bookings.length === 0 ? (
            <div className="card empty-state">No pending bookings to confirm.</div>
          ) : (
            bookings.map(booking => (
              <div className="card" key={booking.id}>
                <div className="card-header">
                  <span className="card-title">{booking.customer.name}</span>
                  <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
                </div>
                <p>Table {booking.table.tableNumber}</p>
                <p>{booking.guestCount} guests</p>
                <p>{new Date(booking.date).toLocaleString()}</p>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => confirmBooking(booking.id)}>
                    Confirm
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => rejectBooking(booking.id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="two-column">
          <div className="main-content">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Branch Menu</span>
              </div>
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
                          <button className="btn btn-primary btn-sm" onClick={() => addToCart(item)}>
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                    {menu.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-state">No menu items available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sidebar-kpi">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Create Order</span>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label className="form-label">Link to Booking (optional)</label>
                  <select
                    className="form-select"
                    value={selectedBookingId ?? ''}
                    onChange={e => setSelectedBookingId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">No booking</option>
                    {bookings.map(booking => (
                      <option key={booking.id} value={booking.id}>
                        #{booking.id} — {booking.customer.name} / Table {booking.table.tableNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cart</label>
                  {cart.length === 0 ? (
                    <div className="empty-state">Add menu items to create an order.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '.75rem' }}>
                      {cart.map(item => (
                        <div key={item.menuItemId} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.5rem', alignItems: 'center' }}>
                          <div>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>${item.price.toFixed(2)} each</div>
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateQuantity(item.menuItemId, Number(e.target.value))}
                              style={{ width: '4rem' }}
                            />
                            <button className="btn btn-outline btn-sm" onClick={() => updateQuantity(item.menuItemId, 0)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div className="stat-card" style={{ marginBottom: '1rem' }}>
                    <div className="stat-value">${cartTotal.toFixed(2)}</div>
                    <div className="stat-label">Cart Total</div>
                  </div>
                  <button className="btn btn-primary" onClick={submitOrder} disabled={cart.length === 0}>
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
