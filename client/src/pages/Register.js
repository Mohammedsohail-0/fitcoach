import { useSearchParams } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (inviteCode) {
      api.get(`/auth/validate-invite/${inviteCode}`)
        .then(() => setValid(true))
        .catch(() => setError('Invalid or expired invite link'));
    }
  }, [inviteCode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', { ...form, role: 'client', inviteCode });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Email or username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>FitCoach</h1>
        <h2>Create Account</h2>
        {error && <p className="error">{error}</p>}
        {!valid ? (
          <p>Validating invite link...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
export default Register;