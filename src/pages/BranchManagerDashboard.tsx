import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  customer?: { name: string };
}

interface Booking {
  id: number;
  date: string;
  guestCount: number;
  table: { tableNumber: number };
  customer: { name: string };
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string | null;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  salary: number | null;
  isActive: boolean;
}

interface Sales {
  totalSales: number;
  orderCount: number;
}

type Tab = 'overview' | 'menu' | 'staff';

export default function BranchManagerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [sales, setSales] = useState<Sales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Steaks');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [savingMenuItem, setSavingMenuItem] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Refresh dashboard when manager opens the Menu tab so chef deactivations are reflected
  useEffect(() => {
    if (activeTab === 'menu') {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [ordersRes, bookingsRes, staffRes, salesRes, menuRes] = await Promise.all([
        api.get('/branch-manager/orders'),
        api.get('/branch-manager/bookings'),
        api.get('/branch-manager/staff'),
        api.get('/branch-manager/sales'),
        api.get('/branch-manager/menu'),
      ]);

      setOrders(ordersRes.data);
      setBookings(bookingsRes.data);
      setStaff(staffRes.data);
      setSales(salesRes.data);
      setMenu(menuRes.data);
    } catch (err) {
      console.error('Branch manager dashboard load failed', err);
      setError('Unable to load dashboard data. Please refresh or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newItemName.trim() || !newItemCategory.trim() || !newItemPrice.trim()) {
      setFormError('Name, category, and price are required.');
      return;
    }

    const priceValue = Number(newItemPrice);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setFormError('Price must be a valid number greater than zero.');
      return;
    }

    setSavingMenuItem(true);
    try {
      const payload = {
        name: newItemName.trim(),
        category: newItemCategory,
        price: priceValue,
        description: newItemDescription.trim() || undefined,
      };
      const response = await api.post('/menu', payload);
      setMenu(prev => [...prev, response.data]);
      setFormSuccess('Menu item added successfully.');
      setNewItemName('');
      setNewItemCategory('Steaks');
      setNewItemPrice('');
      setNewItemDescription('');
    } catch (err: any) {
      console.error('Failed to add menu item', err);
      setFormError(err.response?.data?.error || 'Failed to add menu item.');
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm('Delete this menu item?')) {
      return;
    }

    try {
      const res = await api.delete(`/menu/${id}`);
      // If backend returned a deactivated item, remove it from the visible list
      if (res.status === 204) {
        setMenu(prev => prev.filter(item => item.id !== id));
      } else if (res.data && res.data.item) {
        setMenu(prev => prev.filter(item => item.id !== id));
      } else {
        // fallback: refresh
        loadDashboard();
      }
    } catch (err: any) {
      console.error('Failed to delete menu item', err);
      setError(err.response?.data?.error || 'Failed to delete menu item.');
    }
  };

  const completedOrdersCount = orders.filter(order => order.status === 'DONE' || order.status === 'DELIVERED').length;
  const totalBookingsCount = bookings.length;
  const menuItemCount = menu.length;
  const staffCount = staff.length;
  const totalSalesValue = sales?.totalSales ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Branch Manager Dashboard</h1>
        <p className="page-description">Manage your branch with complete menu, staff, and booking visibility.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat-box">
              <div className="stat-value">{totalSalesValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
              <div className="stat-label">Total Sales</div>
            </div>
            <div className="card stat-box">
              <div className="stat-value">{completedOrdersCount}</div>
              <div className="stat-label">Orders Completed</div>
            </div>
            <div className="card stat-box">
              <div className="stat-value">{staffCount}</div>
              <div className="stat-label">Staff Members</div>
            </div>
            <div className="card stat-box">
              <div className="stat-value">{menuItemCount}</div>
              <div className="stat-label">Menu Items</div>
            </div>
            <div className="card stat-box">
              <div className="stat-value">{totalBookingsCount}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: '1.5rem' }}>
            <button
              className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('menu')}
            >
              Menu Management
            </button>
            <button
              className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('staff')}
            >
              Staff
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="two-column">
              <div className="main-content">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Recent Orders</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center' }}>
                              No recent orders available.
                            </td>
                          </tr>
                        ) : (
                          orders.slice(0, 10).map(order => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.customer?.name || 'Guest'}</td>
                              <td>${order.total.toFixed(2)}</td>
                              <td>{order.status}</td>
                              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="sidebar-kpi">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Upcoming Bookings</span>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="card" style={{ padding: '1rem' }}>
                      No upcoming bookings.
                    </div>
                  ) : (
                    bookings.slice(0, 10).map(booking => (
                      <div key={booking.id} className="card" style={{ marginBottom: '0.75rem' }}>
                        <p><strong>{booking.customer.name}</strong></p>
                        <p>Table {booking.table.tableNumber} • {booking.guestCount} guests</p>
                        <p>{new Date(booking.date).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="two-column">
              <div className="main-content">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Add Menu Item</span>
                  </div>
                  <div className="card-content">
                    {formError && <div className="alert alert-error">{formError}</div>}
                    {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
                    <form onSubmit={handleAddMenuItem}>
                      <div className="form-group">
                        <label className="form-label">Item Name</label>
                        <input
                          className="form-input"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
                          value={newItemCategory}
                          onChange={e => setNewItemCategory(e.target.value)}
                          required
                        >
                          <option value="Steaks">Steaks</option>
                          <option value="Appetizers">Appetizers</option>
                          <option value="Salads">Salads</option>
                          <option value="Sides">Sides</option>
                          <option value="Desserts">Desserts</option>
                          <option value="Beverages">Beverages</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-input"
                          value={newItemPrice}
                          onChange={e => setNewItemPrice(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          value={newItemDescription}
                          onChange={e => setNewItemDescription(e.target.value)}
                          placeholder="Optional description"
                          rows={4}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={savingMenuItem}>
                        {savingMenuItem ? 'Adding...' : 'Add to Menu'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="sidebar-kpi">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Current Menu</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Description</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menu.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center' }}>
                              No menu items available.
                            </td>
                          </tr>
                        ) : (
                          menu.map(item => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.category}</td>
                              <td>${item.price.toFixed(2)}</td>
                              <td>{item.description || '—'}</td>
                              <td>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMenuItem(item.id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Staff Members</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center' }}>
                          No staff members found.
                        </td>
                      </tr>
                    ) : (
                      staff.map(member => (
                        <tr key={member.id}>
                          <td>{member.name}</td>
                          <td>{member.role}</td>
                          <td>{member.salary ? `$${member.salary.toLocaleString()}` : '—'}</td>
                          <td>{member.isActive ? 'Active' : 'Inactive'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
