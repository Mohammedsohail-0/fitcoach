import './Navbar.css';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

function Navbar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const homePath = role === 'coach' ? '/coach' : '/client';

  return (
    <nav className="navbar">
      <Link to={homePath} className="navbar-brand" onClick={() => setMenuOpen(false)}>
        <img src="/logo192.png" alt="GainChek" className="navbar-logo" />
      </Link>

      <button
        className="navbar-burger"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(prev => !prev)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
        {role === 'coach' && (
          <>
            <Link to="/coach" className="navbar-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/coach/templates" className="navbar-link" onClick={() => setMenuOpen(false)}>Templates</Link>
          </>
        )}
        <Button className="navbar-logout" onClick={handleLogout} variant='secondary' text={"Log out"}></Button>
      </div>
    </nav>
  );
}

export default Navbar;