import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints.js';
import { StatusBadge, PriorityBadge, AiBadge, OverdueBadge } from '../../components/Badges.jsx';
import { timeAgo, TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES, apiError } from '../../utils/constants.js';
import { getSocket } from '../../socket/socketClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const fmt = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

function BookInfoPanel({ book, royalty }) {
  if (!book) {
    return (
      <div className="book-info-panel">
        <h3>📚 General / Account Level</h3>
        <p className="text-sm text-secondary">No specific book linked to this ticket.</p>
        {royalty && (
          <div className="royalty-flags">
            <div className="royalty-flag next-payout">Next payout: ~{royalty.nextPayoutDate}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="book-info-panel">
      <h3>📖 {book.title}</h3>
      <div className="info-row"><span className="info-key">ISBN</span><span className="info-value">{book.isbn}</span></div>
      <div className="info-row"><span className="info-key">Status</span><span className="info-value">{book.status}</span></div>
      <div className="info-row"><span className="info-key">MRP</span><span className="info-value">{fmt(book.mrp)}</span></div>
      <div className="info-row"><span className="info-key">Copies Sold</span><span className="info-value">{book.totalCopiesSold ?? 0}</span></div>
      <div className="info-row"><span className="info-key">Royalty Earned</span><span className="info-value">{fmt(book.totalRoyaltyEarned)}</span></div>
      <div className="info-row"><span className="info-key">Royalty Paid</span><span className="info-value">{fmt(book.royaltyPaid)}</span></div>
      <div className="info-row"><span className="info-key">Royalty Pending</span><span className="info-value">{fmt(book.royaltyPending)}</span></div>
      <div className="info-row"><span className="info-key">Last Payout</span><span className="info-value">{fmtDate(book.lastRoyaltyPayoutDate)}</span></div>
      <div className="info-row"><span className="info-key">Print Partner</span><span className="info-value">{book.printPartner ?? '—'}</span></div>
      {book.availableOn?.length > 0 && (
        <div className="info-row"><span className="info-key">Available On</span><span className="info-value">{book.availableOn.join(', ')}</span></div>
      )}
      {royalty && (
        <div className="royalty-flags">
          {royalty.belowThreshold && <div className="royalty-flag below">⚠ Below ₹1,000 threshold — rolls over</div>}
          {royalty.neverPaid && !royalty.belowThreshold && <div className="royalty-flag never-paid">⚠ No payout ever — verify bank details</div>}
          {royalty.inProduction && <div className="royalty-flag in-production">ℹ In production — no royalties yet</div>}
          <div className="royalty-flag next-payout">Next payout: ~{royalty.nextPayoutDate}</div>
        </div>
      )}
    </div>
  );
}

function AiDraftPanel({ ticket, onDraftReady }) {
  const [loading, setLoading] = useState(false);
  const [draftText, setDraftText] = useState(ticket.aiDraft?.body ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [replyStatus, setReplyStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setDraftText(ticket.aiDraft?.body ?? '');
  }, [ticket.aiDraft?.body]);

  async function generate() {
    setLoading(true);
    try {
      const { data } = await adminApi.draftReply(ticket._id);
      const newDraft = data.data?.aiDraft?.body ?? '';
      setDraftText(newDraft);
      onDraftReady(data.data);
      toast.success('Draft generated');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'AI_UNAVAILABLE') {
        toast.error(apiError(err));
      } else {
        toast.error(apiError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!draftText.trim()) { toast.error('Reply body cannot be empty'); return; }
    setSending(true);
    try {
      const { data } = await adminApi.sendReply(ticket._id, draftText.trim(), replyStatus || undefined);
      onDraftReady(data.data);
      toast.success('Reply sent to author');
      setConfirmOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSending(false);
    }
  }

  const draftStatus = ticket.aiDraft?.status;

  return (
    <div className="ai-draft-panel">
      <div className="ai-draft-header">
        <div className="ai-draft-title">
          ✨ AI Draft Reply
          {ticket.aiDraft?.model && <span className="text-xs text-muted">({ticket.aiDraft.model.split('-').slice(0, 2).join('-')})</span>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner"></span> Generating…</> : (draftStatus === 'ready' ? '↻ Regenerate' : '✨ Generate Draft')}
        </button>
      </div>

      {loading && (
        <div className="ai-loading">
          <span className="spinner"></span> Generating AI draft reply…
        </div>
      )}

      {!loading && draftStatus !== 'ready' && draftStatus !== 'pending' && (
        <div className="ai-unavailable">
          {draftStatus === 'failed'
            ? '⚠ AI draft generation failed. You can write a reply manually below.'
            : '✨ Click "Generate Draft" to create an AI-assisted reply grounded in your knowledge base.'}
        </div>
      )}

      {(draftStatus === 'ready' || draftText) && !loading && (
        <>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <textarea
              className="form-textarea"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={8}
              placeholder="AI draft will appear here. You can edit it before sending."
            />
            <div className="char-count">{draftText.length} characters</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.82rem' }}
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value)}
              title="Set ticket status on send"
            >
              <option value="">Keep current status</option>
              <option value="In Progress">Mark In Progress</option>
              <option value="Resolved">Mark Resolved</option>
            </select>
            <button
              className="btn btn-primary"
              disabled={!draftText.trim() || sending}
              onClick={() => setConfirmOpen(true)}
            >
              📤 Send Reply
            </button>
          </div>
        </>
      )}

      {!draftStatus && !loading && (
        <textarea
          className="form-textarea"
          placeholder="Or write a reply manually…"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={6}
          style={{ marginTop: '0.5rem' }}
        />
      )}

      {!draftStatus && draftText && !loading && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto', fontSize: '0.82rem' }} value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
            <option value="">Keep current status</option>
            <option value="In Progress">Mark In Progress</option>
            <option value="Resolved">Mark Resolved</option>
          </select>
          <button className="btn btn-primary" disabled={!draftText.trim() || sending} onClick={() => setConfirmOpen(true)}>
            📤 Send Reply
          </button>
        </div>
      )}

      {confirmOpen && (
        <div className="overlay" onClick={() => setConfirmOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Send reply to author?</h3>
            <p>This will send the reply and it will be visible to the author. Make sure the content is accurate before sending.</p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendReply} disabled={sending}>
                {sending ? 'Sending…' : 'Yes, send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function load() {
    try {
      const { data } = await adminApi.getTicket(id);
      setTicket(data.data);
    } catch {
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    if (socket) {
      const refresh = (t) => { if (t._id === id || t.ticketNumber) load(); };
      socket.on('ticket:updated', refresh);
      socket.on('ticket:ai-ready', refresh);
      return () => { socket.off('ticket:updated', refresh); socket.off('ticket:ai-ready', refresh); };
    }
  }, [id]);

  async function update(payload) {
    setUpdating(true);
    try {
      const { data } = await adminApi.patchTicket(id, payload);
      setTicket(data.data);
      toast.success('Ticket updated');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssignMe() {
    setUpdating(true);
    try {
      const { data } = await adminApi.assignMe(id);
      setTicket(data.data);
      toast.success('Assigned to you');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUpdating(false);
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const { data } = await adminApi.addNote(id, noteText.trim());
      setTicket(data.data);
      setNoteText('');
      toast.success('Note added');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setAddingNote(false);
    }
  }

  async function handleReclassify() {
    try {
      const { data } = await adminApi.reclassify(id);
      setTicket(data.data);
      toast.success('Reclassified');
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (loading) return <div className="loading-screen"><span className="spinner"></span> Loading ticket…</div>;
  if (!ticket) return <div className="error-banner">Ticket not found</div>;

  const ai = ticket.aiStatus;
  const t = ticket;

  return (
    <div className="page-wide">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')}>← Back</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-text-3)' }}>{t.ticketNumber}</span>
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              <AiBadge aiStatus={t.aiStatus} classifiedByRules={t.classifiedByRules} />
              <OverdueBadge isOverdue={t.isOverdue} />
            </div>
            <h1 className="page-title" style={{ fontSize: '1.2rem' }}>{t.subject}</h1>
          </div>
        </div>
      </div>

      <div className="ticket-detail">
        {/* Main */}
        <div className="ticket-main">
          {/* Original query */}
          <div className="ticket-body">
            <div className="section-title">Author's query</div>
            <div className="message-body">{t.description}</div>
            {t.attachments?.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {t.attachments.map((a) => <span key={a.name} className="tag">📎 {a.name}</span>)}
              </div>
            )}
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
              Author: <strong>{t.author?.name}</strong> · Submitted {timeAgo(t.createdAt)}
            </div>
          </div>

          {/* Thread */}
          {t.responses?.length > 0 && (
            <div>
              <div className="section-title">Conversation ({t.responses.length})</div>
              <div className="responses">
                {t.responses.map((r, i) => (
                  <div key={i} className={`response-item role-${r.role}`}>
                    <div className="response-header">
                      <span className="response-author">{r.author?.name ?? (r.role === 'admin' ? 'BookLeaf Support' : t.author?.name)}</span>
                      <span className="response-role">{r.role === 'admin' ? 'Support' : 'Author'}</span>
                      <span className="response-time">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="response-body">{r.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Draft */}
          <AiDraftPanel ticket={t} onDraftReady={(updated) => setTicket(updated)} />

          {/* Internal Notes */}
          <div className="card">
            <div className="section-title">🔒 Internal Notes <span style={{ color: 'var(--color-warning)', fontSize: '0.7rem', fontWeight: 400 }}>Not visible to author</span></div>
            {t.internalNotes?.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {t.internalNotes.map((n, i) => (
                  <div key={i} className="internal-note-item">
                    <div className="internal-note-header">
                      <span className="response-author">{n.author?.name ?? 'Admin'}</span>
                      <span className="internal-label">Internal</span>
                      <span className="response-time">{timeAgo(n.createdAt)}</span>
                    </div>
                    <div className="response-body">{n.body}</div>
                  </div>
                ))}
              </div>
            )}
            <textarea
              className="form-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note (visible only to admins)…"
              rows={3}
            />
            <button className="btn btn-secondary btn-sm mt-1" onClick={addNote} disabled={addingNote || !noteText.trim()}>
              {addingNote ? 'Adding…' : 'Add Note'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="ticket-sidebar">
          {/* Book info */}
          <BookInfoPanel book={t.book} royalty={t.royalty} />

          {/* Controls */}
          <div className="card">
            <div className="section-title">Ticket Controls</div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={t.status} onChange={(e) => update({ status: e.target.value })} disabled={updating}>
                {TICKET_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Priority
                {t.aiPriority && t.aiPriority !== t.priority && (
                  <span className="text-xs text-muted" style={{ marginLeft: 4 }}>(AI: {t.aiPriority})</span>
                )}
              </label>
              <select className="form-select" value={t.priority} onChange={(e) => update({ priority: e.target.value })} disabled={updating}>
                {TICKET_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Category
                {t.aiCategory && t.aiCategory !== t.category && (
                  <span className="text-xs text-muted" style={{ marginLeft: 4 }}>(AI: {t.aiCategory})</span>
                )}
              </label>
              <select className="form-select" value={t.category} onChange={(e) => update({ category: e.target.value })} disabled={updating}>
                {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-2)' }}>
                Assigned to: {t.assignedTo?.name ?? <span style={{ color: 'var(--color-text-3)' }}>Unassigned</span>}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleAssignMe} disabled={updating || t.assignedTo?._id === user?.id}>
                {t.assignedTo?._id === user?.id ? '✓ Assigned to me' : 'Assign to me'}
              </button>
            </div>

            {(ai === 'failed' || ai === 'skipped') && (
              <>
                <div className="divider" />
                <button className="btn btn-ghost btn-sm" onClick={handleReclassify}>
                  🔄 Retry AI Classification
                </button>
              </>
            )}

            {t.aiPriorityReason && (
              <>
                <div className="divider" />
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>
                  <strong>AI reason:</strong> {t.aiPriorityReason}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
