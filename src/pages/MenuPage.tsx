import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
}

interface Branch {
  id: number;
  name: string;
}

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const branchIdFromUrl = searchParams.get('branchId');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerBookings, setCustomerBookings] = useState<any[]>([]);

  useEffect(() => {
    api.get('/public/branches').then(r => setBranches(r.data));
  }, []);

  useEffect(() => {
    if (branchIdFromUrl) {
      const id = parseInt(branchIdFromUrl);
      const branch = branches.find(b => b.id === id);
      setSelectedBranch(id);
      setSelectedBranchName(branch?.name || '');
      loadMenu(id);
    }
    // If logged in as customer, load their bookings to enable ordering for confirmed bookings
    if (user && user.role === 'CUSTOMER') {
      api.get('/customer/bookings').then(r => setCustomerBookings(r.data)).catch(() => setCustomerBookings([]));
    }
  }, [branchIdFromUrl, branches]);

  const loadMenu = async (branchId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/menu/${branchId}`);
      setMenu(res.data);
    } catch (error) {
      console.error('Failed to load menu', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (branchId: number, branchName: string) => {
    setSelectedBranch(branchId);
    setSelectedBranchName(branchName);
    loadMenu(branchId);
  };

  const confirmedBookingForSelectedBranch = () => {
    if (!user || user.role !== 'CUSTOMER' || !selectedBranch) return null;
    return customerBookings.find(b => b.status === 'CONFIRMED' && b.table?.branch?.id === selectedBranch) || null;
  };

  const categories = [...new Set(menu.map(m => m.category))];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Our Menu</h1>
        <p className="page-description">Discover our signature cuts and premium selections</p>
      </div>

      <div className="branch-selector">
        {branches.map(b => (
          <button
            key={b.id}
            className={`branch-btn ${selectedBranch === b.id ? 'active' : ''}`}
            onClick={() => handleBranchChange(b.id, b.name)}
          >
            {b.name}
          </button>
        ))}
      </div>

      {selectedBranch && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{selectedBranchName}</h2>
            {user && user.role === 'CUSTOMER' && (
              (() => {
                const booking = confirmedBookingForSelectedBranch();
                return booking ? (
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/customer/place-order?bookingId=${booking.id}`)}>
                    Place Order (Booking #{booking.id})
                  </button>
                ) : null;
              })()
            )}
          </div>
          {user && user.role === 'CUSTOMER' && !confirmedBookingForSelectedBranch() && (
            <div className="empty-state" style={{ marginTop: '0.75rem' }}>
              No confirmed booking for this location yet. Please book a table and wait for confirmation to place your order.
            </div>
          )}
        </div>
      )}

      {loading && <div className="loading-state">Loading menu...</div>}

      {categories.map(cat => (
        <div className="menu-category" key={cat}>
          <h3 className="menu-category-title">{cat}</h3>
          <div className="menu-items">
            {menu.filter(m => m.category === cat).map(item => (
              <div className="menu-item" key={item.id}>
                <div className="menu-item-name">{item.name}</div>
                {item.description && (
                  <div className="menu-item-desc">{item.description}</div>
                )}
                <div className="menu-item-price">${item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedBranch && menu.length === 0 && !loading && (
        <div className="empty-state">
          No menu items available at this location.
        </div>
      )}
    </div>
  );
}