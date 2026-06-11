import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: number;
  date: string;
  guestCount: number;
  status: string;
  table: { tableNumber: number; branch: { name: string } };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  branch: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders'>('bookings');
  const [loading, setLoading] = useState(true);

  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const hasConfirmedBooking = confirmedBookings.length > 0;
  const primaryConfirmedBooking = confirmedBookings[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, ordersRes] = await Promise.all([
        api.get('/customer/bookings'),
        api.get('/customer/orders'),
      ]);
      setBookings(bookingsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to load customer dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/customer/bookings/${id}`);
      loadData();
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-description">Welcome back, {user?.name} ({user?.email})</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Active Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalSpent.toFixed(0)}</div>
          <div className="stat-label">Total Spent</div>
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings ({bookings.length})
        </button>
        <button
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('orders')}
        >
          My Orders ({orders.length})
        </button>
      </div>

      {activeTab === 'bookings' ? (
        bookings.length === 0 ? (
          <div className="empty-state">
            No bookings yet. <a href="/branches">Book a table</a>
          </div>
        ) : (
          <>
            {hasConfirmedBooking && (
              <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(194,65,12,0.35)' }}>
                <div className="card-header">
                  <span className="card-title">Confirmed booking ready for ordering</span>
                  <span className="badge badge-preparing">CONFIRMED</span>
                </div>
                <p>
                  You have a confirmed booking at {primaryConfirmedBooking.table.branch.name}. Place an order now to start your meal.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/customer/place-order?bookingId=${primaryConfirmedBooking.id}`)}
                >
                  Place Order for Booking #{primaryConfirmedBooking.id}
                </button>
              </div>
            )}
            <div className="card-grid">
              {bookings.map(booking => (
                <div className="card" key={booking.id}>
                  <div className="card-header">
                    <span className="card-title">{booking.table.branch.name}</span>
                    <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
                  </div>
                  <p>📅 {new Date(booking.date).toLocaleString()}</p>
                  <p>👥 {booking.guestCount} guests</p>
                  <p>🪑 Table {booking.table.tableNumber}</p>
                  {booking.status === 'PENDING' && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(booking.id)}>
                      Cancel Booking
                    </button>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/customer/place-order?bookingId=${booking.id}`)}
                    >
                      Place Order
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )
      ) : orders.length === 0 ? (
        <div className="empty-state">No orders yet. Visit the menu to place an order.</div>
      ) : (
        <div className="card-grid">
          {orders.map(order => (
            <div className="card" key={order.id}>
              <div className="card-header">
                <span className="card-title">Order #{order.id}</span>
                <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
              <p>{order.branch.name}</p>
              <p>{order.items.map(item => `${item.menuItem.name} ×${item.quantity}`).join(', ')}</p>
              <p className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>${order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
