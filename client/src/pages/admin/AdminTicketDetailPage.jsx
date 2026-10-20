import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  FileText,
  LockKeyhole,
  MessageCircle,
  RotateCw,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints.js';
import { StatusBadge, PriorityBadge, AiBadge, OverdueBadge } from '../../components/Badges.jsx';
import { timeAgo, TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES, apiError } from '../../utils/constants.js';
import { getSocket } from '../../socket/socketClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { SectionTag } from '../../components/ui/SectionTag.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { useToast } from '../../components/ui/useToast.js';
import { wobbly, wobblyAlt, wobblySoft } from '../../theme/wobbly.js';

function formatMoney(amount) {
  return amount == null ? '—' : `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ContextRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-dashed border-muted py-2 last:border-0">
      <dt className="text-lg text-pencil/70">{label}</dt>
      <dd className="max-w-[65%] break-words text-right text-lg font-bold text-pencil">{value ?? '—'}</dd>
    </div>
  );
}

function BookAuthorPanel({ ticket }) {
  const { book, author, royalty } = ticket;

  return (
    <Card padding="p-5" className="space-y-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center border-2 border-dashed border-ink-blue bg-white text-ink-blue"
          style={{ borderRadius: wobbly }}
        >
          {book
            ? <BookOpen className="h-6 w-6" strokeWidth={2.5} />
            : <UserRound className="h-6 w-6" strokeWidth={2.5} />}
        </span>
        <div className="min-w-0">
          <SectionTag>{book ? 'Book context' : 'Account-level ticket'}</SectionTag>
          <h2 className="mt-1 break-words font-heading text-2xl font-bold leading-tight text-pencil">
            {book?.title ?? 'General / Account Level'}
          </h2>
        </div>
      </div>

      {book ? (
        <dl>
          <ContextRow label="ISBN" value={book.isbn} />
          <ContextRow label="Book status" value={book.status} />
          <ContextRow label="MRP" value={formatMoney(book.mrp)} />
          <ContextRow label="Copies sold" value={(book.totalCopiesSold ?? 0).toLocaleString('en-IN')} />
          <ContextRow label="Royalty earned" value={formatMoney(book.totalRoyaltyEarned)} />
          <ContextRow label="Royalty paid" value={formatMoney(book.royaltyPaid)} />
          <ContextRow label="Royalty pending" value={formatMoney(book.royaltyPending)} />
          <ContextRow label="Last payout" value={formatDate(book.lastRoyaltyPayoutDate)} />
          <ContextRow label="Print partner" value={book.printPartner} />
          {book.availableOn?.length > 0 && <ContextRow label="Available on" value={book.availableOn.join(', ')} />}
        </dl>
      ) : (
        <p className="text-lg leading-relaxed text-pencil/75">No specific book is linked to this support request.</p>
      )}

      {royalty && (
        <div className="space-y-2 border-t-2 border-dashed border-muted pt-4" aria-label="Royalty context">
          <h3 className="font-heading text-xl font-bold text-pencil">Royalty notes</h3>
          {royalty.belowThreshold && (
            <p className="flex items-start gap-2 border-2 border-pencil bg-postit p-3 text-lg leading-relaxed text-pencil" style={{ borderRadius: wobblySoft }}>
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} />
              Below ₹1,000 threshold; pending rolls over.
            </p>
          )}
          {royalty.neverPaid && !royalty.belowThreshold && (
            <p className="flex items-start gap-2 border-2 border-accent bg-white p-3 text-lg leading-relaxed text-[#b91c1c]" style={{ borderRadius: wobblySoft }}>
              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} />
              No payout yet; verify bank details.
            </p>
          )}
          {royalty.inProduction && (
            <p className="border-2 border-ink-blue bg-white p-3 text-lg leading-relaxed text-pencil" style={{ borderRadius: wobblySoft }}>
              Production in progress; royalties start after publication.
            </p>
          )}
          <p className="flex items-center gap-2 text-lg leading-relaxed text-pencil/75">
            <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-blue" strokeWidth={2.5} />
            Next payout: {formatDate(royalty.nextPayoutDate)}
          </p>
        </div>
      )}

      <div className="space-y-2 border-t-2 border-dashed border-muted pt-4">
        <h3 className="font-heading text-xl font-bold text-pencil">Author</h3>
        <dl>
          <ContextRow label="Name" value={author?.name} />
          <ContextRow label="Email" value={author?.email} />
          {author?.authorId && <ContextRow label="Author ID" value={author.authorId} />}
        </dl>
      </div>
    </Card>
  );
}

function AiDraftPanel({ ticket, onTicketUpdated }) {
  const { toast } = useToast();
  const [draftText, setDraftText] = useState(ticket.aiDraft?.body ?? '');
  const [loading, setLoading] = useState(ticket.aiDraft?.status === 'pending');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [replyStatus, setReplyStatus] = useState('In Progress');
  const [generationError, setGenerationError] = useState(null);
  const [replyError, setReplyError] = useState('');

  const draftStatus = ticket.aiDraft?.status;
  const words = draftText.trim() ? draftText.trim().split(/\s+/).length : 0;
  const unavailable = generationError?.type === 'unavailable' || draftStatus === 'failed';
  const rateLimited = generationError?.type === 'rate-limited';
  const needsManualReply = unavailable || rateLimited || (!draftStatus && !loading);

  async function generateDraft() {
    setLoading(true);
    setGenerationError(null);
    try {
      const { data } = await adminApi.draftReply(ticket._id);
      const updatedTicket = data.data;
      setDraftText(updatedTicket.aiDraft?.body ?? '');
      onTicketUpdated(updatedTicket);
      toast('AI draft is ready to review.', { type: 'success' });
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.error?.code;
      const kind = status === 429 || code?.includes('RATE') ? 'rate-limited' : 'unavailable';
      setGenerationError({ type: kind, message: apiError(error) });
      toast(apiError(error), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!draftText.trim()) {
      setReplyError('Write a reply before sending.');
      setConfirmOpen(false);
      return;
    }
    setSending(true);
    setReplyError('');
    try {
      const { data } = await adminApi.sendReply(ticket._id, draftText.trim(), replyStatus);
      onTicketUpdated(data.data);
      toast('Reply sent to the author.', { type: 'success' });
      setConfirmOpen(false);
      setGenerationError(null);
    } catch (error) {
      setReplyError(apiError(error));
      toast(apiError(error), { type: 'error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card decoration="tape" padding="p-5 pt-8 sm:p-6 sm:pt-9" className="space-y-5 border-ink-blue/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center border-2 border-dashed border-ink-blue bg-white text-ink-blue" style={{ borderRadius: wobbly }}>
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-bold text-pencil">AI Draft Reply</h2>
            {ticket.aiDraft?.model && <p className="text-lg text-pencil/70">Model: {ticket.aiDraft.model}</p>}
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={generateDraft} loading={loading} disabled={loading}>
          <RotateCw aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
          {draftStatus === 'ready' ? 'Regenerate' : 'Generate draft'}
        </Button>
      </div>

      {generationError && draftStatus === 'ready' && (
        <p role="alert" className="border-2 border-dashed border-accent bg-white p-3 text-lg leading-relaxed text-[#b91c1c]" style={{ borderRadius: wobblyAlt }}>
          {rateLimited
            ? 'AI is rate limited. Wait a moment before trying to regenerate; your current draft is still available.'
            : `AI could not regenerate the draft: ${generationError.message}`}
        </p>
      )}

      {loading ? (
        <div role="status" className="flex items-center gap-3 border-2 border-dashed border-ink-blue bg-white p-4 text-lg leading-relaxed text-pencil" style={{ borderRadius: wobblyAlt }}>
          <Spinner label="Drafting from the knowledge base" size={30} />
          <span>Drafting from the knowledge base…</span>
        </div>
      ) : draftStatus === 'pending' ? (
        <div role="status" className="flex items-center gap-3 border-2 border-dashed border-ink-blue bg-white p-4 text-lg leading-relaxed text-pencil" style={{ borderRadius: wobblyAlt }}>
          <Spinner label="Drafting from the knowledge base" size={30} />
          <span>Drafting from the knowledge base…</span>
        </div>
      ) : draftStatus === 'ready' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SectionTag className="border-ink-blue bg-white text-ink-blue">AI suggested draft · review before sending</SectionTag>
          </div>
          <Textarea
            id={`ai-draft-${ticket._id}`}
            label="Editable reply draft"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={9}
            className="bg-postit"
            placeholder="Review and edit the suggested response…"
            error={replyError}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg text-pencil/70" aria-live="polite">{words} word{words === 1 ? '' : 's'}</p>
            <Button type="button" onClick={() => { setReplyError(''); setConfirmOpen(true); }} disabled={!draftText.trim()}>
              <Send aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
              Send reply
            </Button>
          </div>
        </>
      ) : needsManualReply ? (
        <div className="space-y-4 border-2 border-dashed border-accent bg-white p-4 sm:p-5" style={{ borderRadius: wobblyAlt }}>
          <div role={generationError || draftStatus === 'failed' ? 'alert' : undefined} className="flex items-start gap-3 text-[#b91c1c]">
            <ShieldAlert aria-hidden="true" className="mt-1 h-6 w-6 shrink-0" strokeWidth={2.5} />
            <div>
              <h3 className="font-heading text-xl font-bold">
                {rateLimited ? 'AI needs a short break.' : 'AI is resting. Write your reply manually.'}
              </h3>
              <p className="mt-1 text-lg leading-relaxed">
                {rateLimited
                  ? 'Please wait a moment before retrying. Your manual reply can be sent now.'
                  : 'Draft generation is unavailable. Your manual reply box is ready to use.'}
              </p>
              {generationError?.message && <p className="mt-1 text-lg leading-relaxed">{generationError.message}</p>}
              {rateLimited && <p className="mt-1 text-lg leading-relaxed">Retry after the provider rate limit clears.</p>}
            </div>
          </div>
          <Textarea
            id={`manual-reply-${ticket._id}`}
            label="Write a reply manually"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={7}
            placeholder="Write a clear, helpful response to the author…"
            error={replyError}
          />
          <p className="text-lg text-pencil/70" aria-live="polite">{words} word{words === 1 ? '' : 's'}</p>
          <Button type="button" onClick={() => { setReplyError(''); setConfirmOpen(true); }} disabled={!draftText.trim()}>
            <Send aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
            Send manual reply
          </Button>
        </div>
      ) : (
        <div className="space-y-4 border-2 border-dashed border-muted bg-white p-4 sm:p-5" style={{ borderRadius: wobblyAlt }}>
          <p className="text-lg leading-relaxed text-pencil">
            Generate a draft from the knowledge base, or write your response manually below.
          </p>
          <Textarea
            id={`manual-reply-${ticket._id}`}
            label="Manual reply"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={7}
            placeholder="Write a reply manually…"
            error={replyError}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg text-pencil/70">{words} word{words === 1 ? '' : 's'}</p>
            <Button type="button" onClick={() => { setReplyError(''); setConfirmOpen(true); }} disabled={!draftText.trim()}>
              <Send aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
              Send reply
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        onConfirm={sendReply}
        title="Send this reply to the author?"
        description="The author will be able to read this message. Please review it before sending."
        confirmLabel="Send reply"
        loading={sending}
      >
        <Select
          label="Ticket status after sending"
          value={replyStatus}
          onChange={(event) => setReplyStatus(event.target.value)}
        >
          <option value="In Progress">Send and mark In Progress</option>
          <option value="Resolved">Send and mark Resolved</option>
        </Select>
      </ConfirmDialog>
    </Card>
  );
}

function Conversation({ ticket }) {
  if (!ticket.responses?.length) {
    return (
      <Card padding="p-5">
        <p className="text-lg leading-relaxed text-pencil/70">No replies in this conversation yet.</p>
      </Card>
    );
  }

  return (
    <ol className="space-y-4">
      {ticket.responses.map((response, index) => {
        const fromAdmin = response.role === 'admin';
        return (
          <li key={`${response._id ?? response.createdAt}-${index}`} className={fromAdmin ? 'pl-3 sm:pl-8' : 'pr-3 sm:pr-8'}>
            <Card
              tone={fromAdmin ? 'postit' : 'paper'}
              padding="p-4"
              className={`space-y-2 ${fromAdmin ? 'border-pencil' : 'border-ink-blue/60'}`}
              style={{ borderRadius: fromAdmin ? wobblyAlt : wobbly }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-lg font-bold text-pencil">
                    {response.author?.name ?? (fromAdmin ? 'BookLeaf Team' : ticket.author?.name)}
                  </span>
                  <SectionTag>{fromAdmin ? 'Team reply' : 'Author'}</SectionTag>
                </div>
                <time dateTime={response.createdAt} className="text-lg text-pencil/70">{timeAgo(response.createdAt)}</time>
              </div>
              <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-pencil">{response.body}</p>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);

  const fetchTicket = useCallback(async () => {
    const { data } = await adminApi.getTicket(id);
    return data.data;
  }, [id]);

  useEffect(() => {
    let active = true;
    function refresh() {
      fetchTicket()
        .then((loadedTicket) => {
          if (!active) return;
          setTicket(loadedTicket);
          setLoadError('');
        })
        .catch((error) => {
          if (!active) return;
          setLoadError(apiError(error));
          toast(apiError(error), { type: 'error' });
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    refresh();
    const socket = getSocket();
    socket?.on('ticket:updated', refresh);
    socket?.on('ticket:ai-ready', refresh);
    return () => {
      active = false;
      socket?.off('ticket:updated', refresh);
      socket?.off('ticket:ai-ready', refresh);
    };
  }, [fetchTicket, toast]);

  function retryLoadTicket() {
    setLoading(true);
    fetchTicket()
      .then((loadedTicket) => {
        setTicket(loadedTicket);
        setLoadError('');
      })
      .catch((error) => {
        setLoadError(apiError(error));
        toast(apiError(error), { type: 'error' });
      })
      .finally(() => setLoading(false));
  }

  async function updateTicket(payload) {
    setUpdating(true);
    try {
      const { data } = await adminApi.patchTicket(id, payload);
      setTicket(data.data);
      toast('Ticket updated.', { type: 'success' });
    } catch (error) {
      toast(apiError(error), { type: 'error' });
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssignMe() {
    setUpdating(true);
    try {
      const { data } = await adminApi.assignMe(id);
      setTicket(data.data);
      toast('Ticket assigned to you.', { type: 'success' });
    } catch (error) {
      toast(apiError(error), { type: 'error' });
    } finally {
      setUpdating(false);
    }
  }

  async function addNote(event) {
    event.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const { data } = await adminApi.addNote(id, noteText.trim());
      setTicket(data.data);
      setNoteText('');
      toast('Internal note added.', { type: 'success' });
    } catch (error) {
      toast(apiError(error), { type: 'error' });
    } finally {
      setAddingNote(false);
    }
  }

  async function handleReclassify() {
    setReclassifying(true);
    try {
      const { data } = await adminApi.reclassify(id);
      setTicket(data.data);
      toast('Ticket reclassified.', { type: 'success' });
    } catch (error) {
      toast(apiError(error), { type: 'error' });
    } finally {
      setReclassifying(false);
    }
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="space-y-6" aria-label="Loading ticket">
        <Skeleton lines={2} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton lines={10} />
          <Skeleton lines={8} />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card role="alert" className="mx-auto flex max-w-2xl flex-col items-start gap-4 border-accent">
        <div className="flex items-center gap-3 text-[#b91c1c]">
          <AlertCircle aria-hidden="true" className="h-7 w-7" strokeWidth={2.5} />
          <h1 className="font-heading text-4xl font-bold md:text-5xl">Ticket unavailable</h1>
        </div>
        <p className="text-lg leading-relaxed text-pencil">{loadError || 'This ticket could not be found.'}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={retryLoadTicket}>
            <RotateCw aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
            Retry
          </Button>
          <Button onClick={() => navigate('/admin')}>
            <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
            Back to queue
          </Button>
        </div>
      </Card>
    );
  }

  const currentTicket = ticket;
  const isAssignedToMe = currentTicket.assignedTo?._id === user?.id;
  const categoryOverridden = Boolean(currentTicket.categoryOverriddenBy)
    && currentTicket.category !== currentTicket.aiCategory;
  const priorityOverridden = Boolean(currentTicket.priorityOverriddenBy)
    && currentTicket.priority !== currentTicket.aiPriority;

  return (
    <div className="min-w-0 space-y-6">
      <header className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="px-4">
          <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
          Back to queue
        </Button>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SectionTag>{currentTicket.ticketNumber}</SectionTag>
            <StatusBadge status={currentTicket.status} />
            <PriorityBadge priority={currentTicket.priority} />
            <AiBadge aiStatus={currentTicket.aiStatus} classifiedByRules={currentTicket.classifiedByRules} />
            <OverdueBadge isOverdue={currentTicket.isOverdue} />
          </div>
          <h1 className="break-words font-heading text-4xl font-bold leading-tight text-pencil md:text-5xl">
            {currentTicket.subject}
          </h1>
          <p className="text-lg leading-relaxed text-pencil/70">
            Submitted by {currentTicket.author?.name ?? 'author'} · {timeAgo(currentTicket.createdAt)}
          </p>
        </div>
      </header>

      {loadError && (
        <Card role="alert" padding="p-4" className="flex flex-wrap items-center justify-between gap-4 border-accent">
          <p className="text-lg text-[#b91c1c]">Live ticket refresh failed: {loadError}</p>
          <Button variant="ghost" onClick={retryLoadTicket}>Retry refresh</Button>
        </Card>
      )}

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Ticket conversation and reply" className="min-w-0 space-y-6">
          <Card decoration="tape" padding="p-6 pt-8" className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText aria-hidden="true" className="h-6 w-6 text-ink-blue" strokeWidth={2.5} />
              <h2 className="font-heading text-2xl font-bold text-pencil">Author’s message</h2>
            </div>
            <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-pencil">{currentTicket.description}</p>
            {currentTicket.attachments?.length > 0 && (
              <ul aria-label="Attachments" className="flex flex-wrap gap-2 border-t-2 border-dashed border-muted pt-3">
                {currentTicket.attachments.map((attachment, index) => (
                  <li key={`${attachment.name}-${index}`}><SectionTag>{attachment.name}</SectionTag></li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t-2 border-dashed border-muted pt-3 text-lg text-pencil/70">
              <span>Author: {currentTicket.author?.name ?? '—'}</span>
              <span>Submitted {formatDate(currentTicket.createdAt)}</span>
            </div>
          </Card>

          <section aria-labelledby="admin-conversation-heading" className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle aria-hidden="true" className="h-6 w-6 text-ink-blue" strokeWidth={2.5} />
              <h2 id="admin-conversation-heading" className="font-heading text-2xl font-bold text-pencil">
                Conversation <span className="text-pencil/70">({currentTicket.responses?.length ?? 0})</span>
              </h2>
            </div>
            <Conversation ticket={currentTicket} />
          </section>

          <AiDraftPanel
            key={`${currentTicket._id}-${currentTicket.aiDraft?.body ?? currentTicket.aiDraft?.status ?? 'manual'}`}
            ticket={currentTicket}
            onTicketUpdated={setTicket}
          />

          <Card padding="p-5 sm:p-6" className="space-y-5 border-4 border-dashed border-accent">
            <header className="flex items-start gap-3">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center border-2 border-accent bg-white text-[#b91c1c]" style={{ borderRadius: wobbly }}>
                <LockKeyhole className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <div>
                <SectionTag className="border-accent bg-white text-[#b91c1c]">Private admin workspace</SectionTag>
                <h2 className="mt-2 font-heading text-2xl font-bold text-pencil">Internal only, never shown to the author</h2>
              </div>
            </header>

            {currentTicket.internalNotes?.length > 0 ? (
              <ol className="space-y-3">
                {currentTicket.internalNotes.map((note, index) => (
                  <li key={`${note._id ?? note.createdAt}-${index}`} className="border-2 border-dashed border-accent/70 bg-white p-4" style={{ borderRadius: wobblyAlt }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-body text-lg font-bold text-pencil">{note.author?.name ?? 'Admin'}</span>
                      <time dateTime={note.createdAt} className="text-lg text-pencil/70">{timeAgo(note.createdAt)}</time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-lg leading-relaxed text-pencil">{note.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-lg leading-relaxed text-pencil/70">No internal notes yet.</p>
            )}

            <form onSubmit={addNote} className="space-y-4">
              <Textarea
                id="internal-note"
                label="Add an internal note"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Record context for the admin team only…"
                rows={4}
              />
              <Button type="submit" variant="secondary" loading={addingNote} disabled={addingNote || !noteText.trim()}>
                <LockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                Add internal note
              </Button>
            </form>
          </Card>
        </section>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
          <BookAuthorPanel ticket={currentTicket} />

          <Card padding="p-5" className="space-y-5">
            <header className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-10 w-10 place-items-center border-2 border-dashed border-accent bg-white text-[#b91c1c]" style={{ borderRadius: wobbly }}>
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <h2 className="font-heading text-2xl font-bold text-pencil">Ticket controls</h2>
            </header>

            <Select
              label="Status"
              value={currentTicket.status}
              onChange={(event) => updateTicket({ status: event.target.value })}
              disabled={updating}
            >
              {TICKET_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </Select>

            <div className="space-y-2">
              <Select
                label="Priority"
                value={currentTicket.priority}
                onChange={(event) => updateTicket({ priority: event.target.value })}
                disabled={updating}
              >
                {TICKET_PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
              </Select>
              {currentTicket.aiPriority && (
                <div className="flex flex-wrap items-center gap-2 text-lg">
                  <span className="text-pencil/70">AI suggested: {currentTicket.aiPriority}</span>
                  {priorityOverridden && <SectionTag className="border-accent bg-white text-[#b91c1c]">Overridden</SectionTag>}
                  {priorityOverridden && (
                    <Button type="button" variant="ghost" className="min-h-12 px-2 font-bold text-ink-blue underline decoration-wavy underline-offset-4" onClick={() => updateTicket({ priority: currentTicket.aiPriority })}>
                      Reset
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Select
                label="Category"
                value={currentTicket.category}
                onChange={(event) => updateTicket({ category: event.target.value })}
                disabled={updating}
              >
                {TICKET_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </Select>
              {currentTicket.aiCategory && (
                <div className="flex flex-wrap items-center gap-2 text-lg">
                  <span className="text-pencil/70">AI suggested: {currentTicket.aiCategory}</span>
                  {categoryOverridden && <SectionTag className="border-accent bg-white text-[#b91c1c]">Overridden</SectionTag>}
                  {categoryOverridden && (
                    <Button type="button" variant="ghost" className="min-h-12 px-2 font-bold text-ink-blue underline decoration-wavy underline-offset-4" onClick={() => updateTicket({ category: currentTicket.aiCategory })}>
                      Reset
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 border-t-2 border-dashed border-muted pt-4">
              <p className="text-lg text-pencil/70">
                Assigned to:{' '}
                <span className="font-bold text-pencil">{currentTicket.assignedTo?.name ?? 'Unassigned'}</span>
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAssignMe}
                loading={updating}
                disabled={updating || isAssignedToMe}
                className="w-full"
              >
                <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                {isAssignedToMe ? 'Assigned to me' : 'Assign to me'}
              </Button>
            </div>

            {(currentTicket.aiStatus === 'failed' || currentTicket.aiStatus === 'skipped') && (
              <div className="space-y-3 border-t-2 border-dashed border-muted pt-4">
                <p className="text-lg leading-relaxed text-pencil/70">
                  {currentTicket.aiPriorityReason || 'AI classification is unavailable; rule-based values are shown.'}
                </p>
                <Button type="button" variant="ghost" onClick={handleReclassify} loading={reclassifying} disabled={reclassifying} className="w-full">
                  <RotateCw aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                  Retry AI classification
                </Button>
              </div>
            )}
            {currentTicket.aiPriorityReason && currentTicket.aiStatus === 'done' && (
              <p className="border-t-2 border-dashed border-muted pt-4 text-lg leading-relaxed text-pencil/70">
                <span className="font-bold text-pencil">AI priority reasoning:</span> {currentTicket.aiPriorityReason}
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
