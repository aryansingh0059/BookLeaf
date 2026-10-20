import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/author/books', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(e, demoEmail, demoPass) {
    e.preventDefault();
    setEmail(demoEmail);
    setPassword(demoPass);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">📚</div>
        <h1 className="login-title">BookLeaf Portal</h1>
        <p className="login-subtitle">Author & Admin Support System</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address <span>*</span></label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password <span>*</span></label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" id="login-btn" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner"></span> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="login-demo">
          <strong>Demo Credentials</strong>
          <div className="demo-cred">
            <a href="#" onClick={(e) => fillDemo(e, 'admin@bookleaf.com', 'Admin@123')}>
              🔑 Admin — admin@bookleaf.com / Admin@123
            </a>
          </div>
          <div className="demo-cred">
            <a href="#" onClick={(e) => fillDemo(e, 'priya.sharma@email.com', 'Author@123')}>
              ✍ Author — priya.sharma@email.com / Author@123
            </a>
          </div>
          <div className="demo-cred">
            <a href="#" onClick={(e) => fillDemo(e, 'rohit.kapoor@email.com', 'Author@123')}>
              ✍ Author — rohit.kapoor@email.com / Author@123
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
