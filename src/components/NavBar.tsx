import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASH: Record<string, string> = {
  ADMIN: '/admin',
  HQ_MANAGER: '/hq',
  BRANCH_MANAGER: '/branch-manager',
  CHEF: '/chef',
  CASHIER: '/cashier',
  CUSTOMER: '/customer',
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">STEAKZ</Link>
      <div className="navbar-menu">
        <Link to="/menu" className="nav-link">Menu</Link>
        <Link to="/branches" className="nav-link">Locations</Link>
        
        {user ? (
          <>
            <Link to={ROLE_DASH[user.role] ?? '/'} className="nav-link">Dashboard</Link>
            {user.role === 'CUSTOMER' && (
              <Link to="/book" className="btn btn-primary btn-sm">Book a Table</Link>
            )}
            <div className="nav-user">
              <div className="nav-avatar">{user.name?.[0] || 'U'}</div>
              <span className="nav-name">{user.name}</span>
              <span className="nav-badge">{user.role.replace('_', ' ')}</span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}