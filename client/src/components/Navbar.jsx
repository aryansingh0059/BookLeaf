import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { disconnectSocket } from '../socket/socketClient.js';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const base = isAdmin ? '/admin' : '/author';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📚</span>
        <span className="navbar-title">BookLeaf</span>
        <span className="navbar-subtitle">{isAdmin ? 'Admin Portal' : 'Author Portal'}</span>
      </div>
      <div className="navbar-links">
        {isAdmin ? (
          <>
            <Link to="/admin" className="nav-link">Dashboard</Link>
            <Link to="/admin/tickets" className="nav-link">Tickets</Link>
          </>
        ) : (
          <>
            <Link to="/author/books" className="nav-link">My Books</Link>
            <Link to="/author/tickets" className="nav-link">My Tickets</Link>
            <Link to="/author/tickets/new" className="nav-link nav-link-primary">Submit Query</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span className="user-name">{user.name}</span>
        <span className="user-role">{user.role}</span>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
      </div>
    </nav>
  );
}
