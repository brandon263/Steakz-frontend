import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Branch { id: number; name: string; address: string; phone: string | null; }
interface User { id: number; name: string; email: string; role: string; isActive: boolean; salary: number | null; branchId: number | null; branch: { name: string } | null; }

export default function AdminDashboard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [branchId, setBranchId] = useState('');
  const [salary, setSalary] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'branches'>('users');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const [branchesRes, usersRes] = await Promise.all([
        api.get('/admin/branches'),
        api.get('/admin/users')
      ]);
      setBranches(branchesRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Unable to load admin data.');
    }
  }

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/branches', { name: branchName, address: branchAddress, phone: branchPhone });
      setMessage('Branch created successfully.');
      setBranchName(''); setBranchAddress(''); setBranchPhone('');
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Unable to create branch.');
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', { name, email, password, role, branchId: branchId || null, salary: salary ? parseFloat(salary) : undefined });
      setMessage('User created successfully.');
      setName(''); setEmail(''); setPassword(''); setRole('CUSTOMER'); setBranchId(''); setSalary('');
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Unable to create user.');
    }
  }

  async function updateUserRole(id: number, role: string, branchId: number | null) {
    try {
      await api.patch(`/admin/users/${id}/role`, { role, branchId });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Unable to update user role.');
    }
  }

  async function toggleUser(id: number, enabled: boolean) {
    try {
      await api.patch(`/admin/users/${id}/${enabled ? 'enable' : 'disable'}`);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Unable to update user status.');
    }
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Unable to delete user.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-description">Manage branches and team members across the STEAKZ network.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="btn-group" style={{ marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
        <button 
          className={`btn ${activeTab === 'branches' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('branches')}
        >
          Manage Branches
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-users-layout">
          <div className="main-content">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Create New User</span>
              </div>
              <form onSubmit={addUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                      <option value="ADMIN">Admin</option>
                      <option value="HQ_MANAGER">HQ Manager</option>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="CHEF">Chef</option>
                      <option value="CASHIER">Cashier</option>
                      <option value="CUSTOMER">Customer</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" value={branchId} onChange={e => setBranchId(e.target.value)}>
                      <option value="">None</option>
                      {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Salary</label>
                    <input type="number" step="0.01" className="form-input" value={salary} onChange={e => setSalary(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Create User</button>
              </form>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
              <div className="card-header">
                <span className="card-title">All Users</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            className="form-select"
                            value={user.role}
                            onChange={e => updateUserRole(user.id, e.target.value, user.branchId)}
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="HQ_MANAGER">HQ Manager</option>
                            <option value="BRANCH_MANAGER">Branch Manager</option>
                            <option value="CHEF">Chef</option>
                            <option value="CASHIER">Cashier</option>
                            <option value="CUSTOMER">Customer</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={user.branchId ?? ''}
                            onChange={e => {
                              const newBranchId = e.target.value ? parseInt(e.target.value, 10) : null;
                              updateUserRole(user.id, user.role, newBranchId);
                            }}
                          >
                            <option value="">None</option>
                            {branches.map(branch => (
                              <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>{user.isActive ? 'Active' : 'Disabled'}</td>
                        <td className="btn-group" style={{ gap: '0.25rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => toggleUser(user.id, !user.isActive)}>
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="two-column">
          <div className="main-content">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Add New Branch</span>
              </div>
              <form onSubmit={addBranch}>
                <div className="form-group">
                  <label className="form-label">Branch Name</label>
                  <input className="form-input" value={branchName} onChange={e => setBranchName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={branchPhone} onChange={e => setBranchPhone(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary">Add Branch</button>
              </form>
            </div>
          </div>
          <div className="sidebar-kpi">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Existing Branches</span>
              </div>
              {branches.map(branch => (
                <div key={branch.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div><strong>{branch.name}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{branch.address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}