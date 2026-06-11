import { useEffect, useState } from 'react';
import api from '../api/axios';

interface BranchOverview {
  id: number;
  name: string;
  address: string;
  _count: { users: number };
  pendingOrders: number;
  completeOrders: number;
}

interface SalesData {
  branchName: string;
  totalSales: number;
  orderCount: number;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  salary: number | null;
  branch: { name: string } | null;
  isActive: boolean;
}

export default function HQDashboard() {
  const [branches, setBranches] = useState<BranchOverview[]>([]);
  const [sales, setSales] = useState<SalesData[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError('');
    setMessage('');
    try {
      const [branchesRes, salesRes, staffRes] = await Promise.all([
        api.get('/hq/overview'),
        api.get('/hq/sales'),
        api.get('/hq/staff'),
      ]);
      setBranches(branchesRes.data);
      setSales(salesRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to load HQ data', error);
      setError('Unable to load HQ data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading headquarters data...</div>
      </div>
    );
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalOrders = sales.reduce((sum, s) => sum + s.orderCount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">HQ Dashboard</h1>
        <p className="page-description">Centralized reporting for all restaurant locations</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{branches.length}</div>
          <div className="stat-label">Active Branches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{staff.length}</div>
          <div className="stat-label">Total Staff</div>
        </div>
      </div>

      <div className="hq-branch-grid">
        {branches.map(branch => (
          <div key={branch.id} className="branch-card">
            <div className="branch-card-title">{branch.name}</div>
            <div className="branch-card-subtitle">{branch.address}</div>
            <div className="branch-card-stats">
              Pending {branch.pendingOrders} · Complete {branch.completeOrders}
            </div>
            <div className="branch-card-stats">
              Total {branch.pendingOrders + branch.completeOrders} orders · {branch._count.users} staff
            </div>
          </div>
        ))}
      </div>

      <div className="hq-dashboard-layout">
        <div className="main-content">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Sales by Branch</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.branchName}>
                      <td>{s.branchName}</td>
                      <td>{s.orderCount}</td>
                      <td>${s.totalSales.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <span className="card-title">Staff Overview</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.role}</td>
                  <td>{member.branch?.name || 'HQ'}</td>
                  <td>{member.salary != null ? `$${member.salary.toFixed(2)}` : 'N/A'}</td>
                  <td>{member.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}