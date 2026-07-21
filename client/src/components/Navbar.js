import './Navbar.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homePath = role === 'coach' ? '/coach' : '/client';

  return (
    <nav className="navbar">
      <Link to={homePath} className="navbar-brand">FitCoach</Link>
      <div className="navbar-links">
        {role === 'coach' && (
          <Link to="/coach" className="navbar-link">Dashboard</Link>
        )}
        <button className="navbar-logout" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}

export default Navbar;