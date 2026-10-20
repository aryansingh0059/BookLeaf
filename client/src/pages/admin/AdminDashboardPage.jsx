import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints.js';
import { StatusBadge, PriorityBadge, AiBadge, OverdueBadge } from '../../components/Badges.jsx';
import { timeAgo, TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES } from '../../utils/constants.js';
import { connectSocket, getSocket } from '../../socket/socketClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

function StatCard({ label, value, desc, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color, borderTopWidth: 3 }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
      {desc && <span className="stat-desc">{desc}</span>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef();
  const LIMIT = 20;

  function loadStats() {
    adminApi.stats().then(({ data }) => setStats(data.data)).catch(() => {});
  }

  function loadTickets(p = 1, f = filters, s = search) {
    const params = { page: p, limit: LIMIT, ...f };
    if (s) params.search = s;
    adminApi.listTickets(params)
      .then(({ data }) => {
        setTickets(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStats();
    loadTickets(1);
    const socket = connectSocket(token);

    socket.on('ticket:created', (ticket) => {
      toast('🎫 New ticket: ' + ticket.subject, { duration: 4000 });
      loadTickets(1);
      loadStats();
    });
    socket.on('ticket:updated', () => { loadTickets(page); loadStats(); });
    socket.on('ticket:ai-ready', (ticket) => {
      toast.success(`AI classified: ${ticket.ticketNumber}`);
      loadTickets(page);
    });

    pollingRef.current = setInterval(() => {
      if (!socket.connected) { loadTickets(page); loadStats(); }
    }, 15000);

    return () => {
      clearInterval(pollingRef.current);
      socket.off('ticket:created');
      socket.off('ticket:updated');
      socket.off('ticket:ai-ready');
    };
  }, [token]);

  function applyFilter(key, value) {
    const newFilters = { ...filters };
    if (value) newFilters[key] = value;
    else delete newFilters[key];
    setFilters(newFilters);
    setPage(1);
    loadTickets(1, newFilters, search);
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadTickets(1, filters, search);
  }

  function clearFilters() {
    setFilters({});
    setSearch('');
    setPage(1);
    loadTickets(1, {}, '');
  }

  function changePage(p) {
    setPage(p);
    loadTickets(p, filters, search);
  }

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="page-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Support ticket queue</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard label="Total" value={stats.total} color="var(--color-text-2)" />
          <StatCard label="Open" value={stats.byStatus?.Open ?? 0} color="var(--color-info)" />
          <StatCard label="In Progress" value={stats.byStatus?.['In Progress'] ?? 0} color="var(--color-warning)" />
          <StatCard label="Resolved" value={stats.byStatus?.Resolved ?? 0} color="var(--color-success)" />
          <StatCard label="⚠ Overdue" value={stats.overdue ?? 0} color="var(--color-danger)" />
          <StatCard label="Critical" value={stats.byPriority?.Critical ?? 0} color="var(--color-danger)" />
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="search"
            className="form-input"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '200px' }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>

        <select className="form-select" style={{ width: 'auto' }} value={filters.status ?? ''} onChange={(e) => applyFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {TICKET_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select className="form-select" style={{ width: 'auto' }} value={filters.priority ?? ''} onChange={(e) => applyFilter('priority', e.target.value)}>
          <option value="">All priorities</option>
          {TICKET_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>

        <select className="form-select" style={{ width: 'auto' }} value={filters.category ?? ''} onChange={(e) => applyFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <input type="date" className="form-input" style={{ width: '150px' }} onChange={(e) => applyFilter('dateFrom', e.target.value)} title="From date" />
        <input type="date" className="form-input" style={{ width: '150px' }} onChange={(e) => applyFilter('dateTo', e.target.value)} title="To date" />

        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
        <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>{total} ticket{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Author</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>AI</th>
                <th>Age</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner"></span></td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-3)' }}>No tickets match your filters</td></tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="clickable" onClick={() => navigate(`/admin/tickets/${t._id}`)}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{t.ticketNumber}</span></td>
                    <td><span style={{ fontSize: '0.85rem' }}>{t.author?.name ?? '—'}</span></td>
                    <td style={{ maxWidth: '280px' }}>
                      <div className="truncate" style={{ fontWeight: 500 }}>{t.subject}</div>
                      {t.isOverdue && <OverdueBadge isOverdue />}
                    </td>
                    <td><span className="text-sm text-secondary">{t.category}</span></td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><AiBadge aiStatus={t.aiStatus} classifiedByRules={t.classifiedByRules} /></td>
                    <td><span className="text-sm text-muted">{timeAgo(t.createdAt)}</span></td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)' }}>
                        {t.assignedTo?.name ?? <span style={{ color: 'var(--color-text-3)' }}>Unassigned</span>}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => changePage(page - 1)}>‹</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => changePage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
