import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  MessageCircle,
  Plus,
  Send,
  Ticket,
  X,
} from 'lucide-react';
import { ticketsApi } from '../../api/endpoints.js';
import { StatusBadge } from '../../components/Badges.jsx';
import { timeAgo, apiError } from '../../utils/constants.js';
import { connectSocket } from '../../socket/socketClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { SectionTag } from '../../components/ui/SectionTag.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { useToast } from '../../components/ui/useToast.js';
import { wobbly, wobblyAlt } from '../../theme/wobbly.js';

function TicketDetailPanel({ ticket, onClose, onUpdated, hasNewReply }) {
  const { toast } = useToast();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await ticketsApi.reply(ticket._id, reply.trim());
      onUpdated(data.data);
      setReply('');
      toast('Reply sent.', { type: 'success' });
    } catch (err) {
      toast(apiError(err), { type: 'error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="ticket-detail-heading" className="min-w-0 space-y-5">
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <SectionTag>{ticket.ticketNumber}</SectionTag>
            <h2 id="ticket-detail-heading" className="break-words font-heading text-3xl font-bold leading-tight text-pencil">
              {ticket.subject}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              {ticket.book && <SectionTag>{ticket.book.title}</SectionTag>}
              {hasNewReply && <SectionTag className="border-accent bg-postit text-[#b91c1c]">New reply!</SectionTag>}
            </div>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            aria-label="Close ticket details"
            className="h-12 w-12 shrink-0 p-0"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
          </Button>
        </div>
        <p className="text-lg text-pencil/70">Opened {timeAgo(ticket.createdAt)}</p>
      </Card>

      <div className="space-y-3">
        <h3 className="font-heading text-2xl font-bold text-pencil">Your query</h3>
        <Card className="space-y-3 p-5">
          <p className="text-lg font-bold text-pencil/70">You · {timeAgo(ticket.createdAt)}</p>
          <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-pencil">{ticket.description}</p>
          {ticket.attachments?.length > 0 && (
            <ul aria-label="Attachments" className="flex flex-wrap gap-2 border-t-2 border-dashed border-muted pt-3">
              {ticket.attachments.map((attachment, index) => (
                <li key={`${attachment.name}-${index}`}>
                  <SectionTag>{attachment.name}</SectionTag>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-labelledby="conversation-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-ink-blue" strokeWidth={2.5} />
          <h3 id="conversation-heading" className="font-heading text-2xl font-bold text-pencil">Conversation</h3>
        </div>
        {ticket.responses?.length ? (
          <ol className="space-y-4">
            {ticket.responses.map((response, index) => {
              const fromTeam = response.role === 'admin';
              return (
                <li key={`${response._id ?? response.createdAt}-${index}`} className={fromTeam ? 'pl-3 sm:pl-8' : 'pr-3 sm:pr-8'}>
                  <Card
                    tone={fromTeam ? 'postit' : 'paper'}
                    className={`relative space-y-2 p-4 sm:p-5 ${fromTeam ? 'border-pencil' : 'border-ink-blue/60'}`}
                    style={{ borderRadius: fromTeam ? wobblyAlt : wobbly }}
                  >
                    {fromTeam && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 14"
                        className="absolute -bottom-[13px] left-7 h-4 w-5"
                      >
                        <path d="M1 0h18L5 13z" fill="#fff9c4" stroke="#2d2d2d" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <p className="font-body text-lg font-bold text-pencil">
                        {fromTeam ? 'BookLeaf Team' : (response.author?.name ?? 'You')}
                      </p>
                      <time dateTime={response.createdAt} className="text-lg text-pencil/70">
                        {timeAgo(response.createdAt)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-pencil">{response.body}</p>
                  </Card>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="border-l-4 border-dashed border-muted py-2 pl-4 text-lg leading-relaxed text-pencil/70">
            No replies yet. Our team will respond here.
          </p>
        )}
      </section>

      {ticket.status !== 'Closed' && (
        <Card decoration="tape" className="space-y-4 pt-8">
          <form onSubmit={sendReply} className="space-y-4">
            <Textarea
              id={`follow-up-${ticket._id}`}
              label={ticket.status === 'Resolved' ? 'Send a follow-up (this will re-open the ticket)' : 'Add a reply'}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Type your message…"
              rows={4}
            />
            <Button type="submit" loading={sending} disabled={sending || !reply.trim()}>
              <Send aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
              Send Reply
            </Button>
          </form>
        </Card>
      )}
    </section>
  );
}

function TicketListItem({ ticket, selected, hasNewReply, onSelect }) {
  return (
    <Card
      className={`min-w-0 p-0 ${selected ? 'border-ink-blue bg-ink-blue/5' : ''} ${hasNewReply ? 'animate-author-ticket-bounce' : ''}`}
    >
      <Button
        variant="ghost"
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="min-h-0 w-full flex-col items-stretch justify-start gap-2 border-0 px-4 py-3 text-left font-normal text-pencil shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-transparent hover:text-pencil hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-lg font-bold">{ticket.ticketNumber}</span>
          {hasNewReply && <SectionTag className="border-accent bg-postit text-[#b91c1c]">New reply!</SectionTag>}
        </span>
        <span className="w-full break-words text-left text-lg leading-snug">{ticket.subject}</span>
        <span className="flex w-full flex-wrap items-center justify-between gap-2">
          <StatusBadge status={ticket.status} />
          <time dateTime={ticket.createdAt} className="text-lg text-pencil/70">{timeAgo(ticket.createdAt)}</time>
        </span>
      </Button>
    </Card>
  );
}

function TicketListSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-3" aria-label="Loading tickets">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="space-y-3 p-4">
          <Skeleton lines={2} />
          <Skeleton className="max-w-40" />
        </Card>
      ))}
    </div>
  );
}

export default function MyTicketsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [newReplyIds, setNewReplyIds] = useState(() => new Set());
  const pollingRef = useRef(null);
  const loadTickets = useCallback(async () => {
    try {
      const { data } = await ticketsApi.list();
      setTickets(data.data ?? []);
      setLoadError('');
    } catch (err) {
      setLoadError(apiError(err));
    }
  }, []);

  useEffect(() => {
    let active = true;
    ticketsApi.list()
      .then(({ data }) => {
        if (!active) return;
        setTickets(data.data ?? []);
        setLoadError('');
      })
      .catch((err) => {
        if (active) setLoadError(apiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const socket = connectSocket(token);
    const replyTimers = new Map();

    function updateTicket(updated) {
      setTickets((current) => current.map((ticket) => ticket._id === updated._id ? updated : ticket));
      setSelected((current) => current?._id === updated._id ? updated : current);
    }

    function handleReply(updated) {
      updateTicket(updated);
      const latestResponse = updated.responses?.[updated.responses.length - 1];
      if (latestResponse?.role !== 'admin') return;

      const ticketId = updated._id;
      setNewReplyIds((current) => new Set(current).add(ticketId));
      window.clearTimeout(replyTimers.get(ticketId));
      replyTimers.set(ticketId, window.setTimeout(() => {
        setNewReplyIds((current) => {
          const next = new Set(current);
          next.delete(ticketId);
          return next;
        });
        replyTimers.delete(ticketId);
      }, 5000));
      toast(`BookLeaf Team replied to ticket ${updated.ticketNumber}.`, { type: 'info' });
    }

    socket.on('ticket:reply', handleReply);
    socket.on('ticket:updated', updateTicket);

    pollingRef.current = window.setInterval(() => {
      if (!socket.connected) loadTickets();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(pollingRef.current);
      socket.off('ticket:reply', handleReply);
      socket.off('ticket:updated', updateTicket);
      for (const timer of replyTimers.values()) window.clearTimeout(timer);
      replyTimers.clear();
    };
  }, [loadTickets, toast, token]);

  function handleUpdated(updated) {
    setTickets((current) => current.map((ticket) => ticket._id === updated._id ? updated : ticket));
    setSelected(updated);
  }

  const goToSubmit = () => navigate('/author/tickets/new');

  if (loading && tickets.length === 0 && !loadError) {
    return (
      <div className="space-y-6">
        <div>
          <SectionTag>Support desk</SectionTag>
          <h1 className="mt-3 font-heading text-4xl font-bold text-pencil md:text-5xl">My Tickets</h1>
        </div>
        <TicketListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTag>Support desk</SectionTag>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-pencil md:text-5xl">My Tickets</h1>
          <p className="mt-2 text-lg leading-relaxed text-pencil/75">
            {tickets.length} support request{tickets.length !== 1 ? 's' : ''}
            {loading && <span className="ml-2" role="status">Refreshing…</span>}
          </p>
        </div>
        <Button onClick={goToSubmit}>
          <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
          Submit New Query
        </Button>
      </header>

      {loadError && (
        <Card role="alert" className="flex flex-wrap items-center justify-between gap-4 border-accent p-4">
          <p className="text-lg leading-relaxed text-[#b91c1c]">Could not load tickets: {loadError}</p>
          <Button
            variant="ghost"
            onClick={() => {
              setLoading(true);
              setLoadError('');
              loadTickets().finally(() => setLoading(false));
            }}
          >
            Try again
          </Button>
        </Card>
      )}

      {!loadError && tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ticket}
            heading="No tickets yet"
            description="Have a question about your book, royalties, or production? Send us a query and our team will help."
            action={(
              <Button onClick={goToSubmit}>
                <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                Submit your first query
              </Button>
            )}
          />
        </Card>
      ) : tickets.length > 0 ? (
        <div className={`grid min-w-0 items-start gap-5 ${selected ? 'grid-cols-1 lg:grid-cols-[minmax(17rem,21rem)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
          <section aria-label="Your support tickets" className="min-w-0 space-y-3">
            {tickets.map((ticket) => (
              <TicketListItem
                key={ticket._id}
                ticket={ticket}
                selected={selected?._id === ticket._id}
                hasNewReply={newReplyIds.has(ticket._id)}
                onSelect={() => setSelected(selected?._id === ticket._id ? null : ticket)}
              />
            ))}
          </section>
          {selected && (
            <TicketDetailPanel
              ticket={selected}
              hasNewReply={newReplyIds.has(selected._id)}
              onClose={() => setSelected(null)}
              onUpdated={handleUpdated}
            />
          )}
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {newReplyIds.size > 0 ? 'A new support reply has arrived.' : ''}
      </div>
      {!selected && tickets.length > 0 && (
        <p className="flex items-center gap-2 text-lg text-pencil/70">
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
          Select a ticket to read the conversation.
        </p>
      )}
    </div>
  );
}
