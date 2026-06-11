import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Branch { id: number; name: string; }
interface Table { id: number; tableNumber: number; capacity: number; }

export default function BookTablePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const branchIdFromUrl = searchParams.get('branchId');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [date, setDate] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') {
      navigate('/login');
      return;
    }
    api.get('/public/branches').then(r => setBranches(r.data));
  }, [user, navigate]);

  useEffect(() => {
    if (branchIdFromUrl && branches.length > 0) {
      setSelectedBranchId(branchIdFromUrl);
      loadTables(branchIdFromUrl);
    }
  }, [branchIdFromUrl, branches]);

  const loadTables = async (branchId: string) => {
    const res = await api.get(`/public/branches/${branchId}`);
    setTables(res.data.tables ?? []);
  };

  const handleBranchChange = async (id: string) => {
    setSelectedBranchId(id);
    setTableId('');
    if (id) {
      await loadTables(id);
    } else {
      setTables([]);
    }
  };

  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/customer/bookings', {
        tableId: parseInt(tableId),
        guestCount: parseInt(guestCount),
        date,
      });
      setSuccess('Table booked successfully! Redirecting...');
      setTimeout(() => navigate('/customer'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Book a Table</h1>
        <p className="page-description">Reserve your table at any STEAKZ location</p>
      </div>
      <div className="booking-card">
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Location</label>
              <select 
                className="form-select" 
                value={selectedBranchId} 
                onChange={e => handleBranchChange(e.target.value)} 
                required
              >
                <option value="">Select a location</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Table</label>
              <select 
                className="form-select" 
                value={tableId} 
                onChange={e => setTableId(e.target.value)} 
                required 
                disabled={!selectedBranchId}
              >
                <option value="">Select a table</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.tableNumber} (seats {t.capacity})</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Guests</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="1" 
                  max="20" 
                  value={guestCount} 
                  onChange={e => setGuestCount(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input"
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                  min={getDefaultDate()} 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Confirm Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}