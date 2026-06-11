import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '6rem', marginBottom: '1rem' }}>404</h1>
      <div className="hero-divider" style={{ marginBottom: '1rem' }} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Page not found. Return to the STEAKZ home experience.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}