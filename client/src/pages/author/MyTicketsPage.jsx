import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '../../api/endpoints.js';
import { StatusBadge } from '../../components/Badges.jsx';
import { timeAgo, apiError } from '../../utils/constants.js';
import { connectSocket, getSocket } from '../../socket/socketClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

function TicketDetailPanel({ ticket, onClose, onUpdated }) {
  const { user } = useAuth();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onReply(updated) {
      if (updated._id === ticket._id || updated.ticketNumber === ticket.ticketNumber) {
        onUpdated(updated);
        setHasNew(true);
        setTimeout(() => setHasNew(false), 5000);
      }
    }
    socket.on('ticket:reply', onReply);
    socket.on('ticket:updated', onReply);
    return () => { socket.off('ticket:reply', onReply); socket.off('ticket:updated', onReply); };
  }, [ticket, onUpdated]);

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await ticketsApi.reply(ticket._id, reply.trim());
      onUpdated(data.data);
      setReply('');
      toast.success('Reply sent');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ticket-main">
      <div className="ticket-header-card">
        <div className="ticket-header-top">
          <div>
            <div className="ticket-subject-large">{ticket.subject}</div>
            <div className="ticket-info-row" style={{ marginTop: '0.5rem' }}>
              <span className="ticket-number">{ticket.ticketNumber}</span>
              <StatusBadge status={ticket.status} />
              {ticket.book && <span className="tag">📖 {ticket.book.title}</span>}
              {hasNew && <span className="new-reply-dot" title="New reply"></span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <div className="text-xs text-[var(--color-text-3)]">Opened {timeAgo(ticket.createdAt)}</div>
      </div>

      <div className="ticket-body">
        <div className="section-title">Your query</div>
        <div className="message-body">{ticket.description}</div>
        {ticket.attachments?.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {ticket.attachments.map((a) => <span key={a.name} className="tag">📎 {a.name}</span>)}
          </div>
        )}
      </div>

      {ticket.responses?.length > 0 && (
        <div>
          <div className="section-title">Conversation</div>
          <div className="responses">
            {ticket.responses.map((r, i) => (
              <div key={i} className={`response-item role-${r.role}`}>
                <div className="response-header">
                  <span className="response-author">{r.author?.name ?? (r.role === 'admin' ? 'BookLeaf Support' : 'You')}</span>
                  <span className="response-role">{r.role === 'admin' ? 'Support' : 'Author'}</span>
                  <span className="response-time">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="response-body">{r.body}</div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {ticket.status !== 'Closed' && (
        <form onSubmit={sendReply}>
          <div className="form-group">
            <label className="form-label">
              {ticket.status === 'Resolved' ? 'Send a follow-up (this will re-open the ticket)' : 'Add a reply'}
            </label>
            <textarea
              className="form-textarea"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your message…"
              rows={4}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending || !reply.trim()}>
            {sending ? <><span className="spinner"></span> Sending…</> : 'Send Reply'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function MyTicketsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const pollingRef = useRef();

  function loadTickets() {
    ticketsApi.list()
      .then(({ data }) => setTickets(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTickets();
    const socket = connectSocket(token);

    // Socket live updates
    socket.on('ticket:reply', (updated) => {
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      if (selected?._id === updated._id) setSelected(updated);
    });
    socket.on('ticket:updated', (updated) => {
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      if (selected?._id === updated._id) setSelected(updated);
    });

    // Fallback polling every 15s if socket disconnects
    pollingRef.current = setInterval(() => {
      if (!socket.connected) loadTickets();
    }, 15000);

    return () => {
      clearInterval(pollingRef.current);
      socket.off('ticket:reply');
      socket.off('ticket:updated');
    };
  }, [token]);

  function handleUpdated(updated) {
    setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setSelected(updated);
  }

  if (loading) return <div className="loading-screen"><span className="spinner"></span> Loading tickets…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tickets</h1>
          <p className="page-subtitle">{tickets.length} support request{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/author/tickets/new')}>
          + Submit New Query
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <h3>No tickets yet</h3>
          <p>Have a question about your book, royalties, or production? Submit a query and our team will help.</p>
          <button className="btn btn-primary" onClick={() => navigate('/author/tickets/new')}>
            Submit Your First Query
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
          <div className="ticket-list">
            {tickets.map((t) => (
              <div
                key={t._id}
                className={`ticket-row ${selected?._id === t._id ? 'selected' : ''}`}
                onClick={() => setSelected(selected?._id === t._id ? null : t)}
              >
                <span className="ticket-number">{t.ticketNumber}</span>
                <span className="ticket-subject">{t.subject}</span>
                <div className="ticket-badges">
                  <StatusBadge status={t.status} />
                </div>
                <span className="ticket-meta">{timeAgo(t.createdAt)}</span>
              </div>
            ))}
          </div>

          {selected && (
            <TicketDetailPanel
              ticket={selected}
              onClose={() => setSelected(null)}
              onUpdated={handleUpdated}
            />
          )}
        </div>
      )}
    </div>
  );
}
