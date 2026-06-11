import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string | null;
}

export default function BranchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/branches')
      .then(res => {
        setBranches(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBookTable = (branchId: number) => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'CUSTOMER') {
      alert('Only customers can book tables.');
    } else {
      navigate(`/book?branchId=${branchId}`);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Our Locations</h1>
        <p className="page-description">Visit us at any of our 7 premium locations across the city</p>
      </div>
      <div className="branch-grid">
        {branches.map(branch => (
          <div className="branch-card" key={branch.id}>
            <h2 className="branch-name">{branch.name}</h2>
            <div className="branch-address">{branch.address}</div>
            {branch.phone && <div className="branch-phone">📞 {branch.phone}</div>}
            <div className="branch-actions">
              <Link to={`/menu?branchId=${branch.id}`} className="btn btn-secondary btn-sm">
                View Menu
              </Link>
              <button 
                onClick={() => handleBookTable(branch.id)} 
                className="btn btn-primary btn-sm"
              >
                Book a Table
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}