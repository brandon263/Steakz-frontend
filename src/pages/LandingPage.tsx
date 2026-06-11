import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="hero">
      <h1>STEAKZ</h1>
      <div className="hero-divider" />
      <p>An unrivalled steakhouse experience across seven distinguished locations.<br />Select your preferred venue to explore our menu or reserve your table.</p>
      <div className="hero-buttons">
        <Link to="/menu" className="btn btn-primary">Explore Our Locations</Link>
        <Link to="/register" className="btn btn-outline">Create an Account</Link>
      </div>

      <div className="hero-lower">
        <h2 className="hero-subtagline">Savor the warmth of every cut.</h2>
        <div className="hero-orb" aria-hidden="true">
          <img src="/hero-steak.jpg" alt="Steak centerpiece" />
        </div>
      </div>
    </div>
  );
}