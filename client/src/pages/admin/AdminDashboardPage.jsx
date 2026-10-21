import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Filter,
  Inbox,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import {
  StatusBadge,
  PriorityBadge,
  AiBadge,
} from "../../components/Badges.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import {
  timeAgo,
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  apiError,
} from "../../utils/constants.js";
import { connectSocket } from "../../socket/socketClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { SectionTag } from "../../components/ui/SectionTag.jsx";
import { Select } from "../../components/ui/Select.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { useToast } from "../../components/ui/useToast.js";

const PAGE_SIZE = 20;
const ALL_TICKET_LIMIT = 100;

function StatTile({ label, value, icon: Icon, onClick, active = false }) {
  return (
    <Card
      tone="postit"
      padding="p-0"
      className={`min-w-0 ${active ? "border-accent shadow-hard-sm" : ""}`}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="min-h-28 w-full flex-col items-start justify-between gap-2 border-0 bg-transparent px-4 py-3 text-left text-pencil shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-transparent hover:text-pencil hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-lg font-bold">{label}</span>
          <Icon
            aria-hidden="true"
            className="h-6 w-6 shrink-0 text-pencil/70"
            strokeWidth={2.5}
          />
        </span>
        <span className="font-heading text-4xl font-bold leading-none">
          {value ?? "—"}
        </span>
      </Button>
    </Card>
  );
}

function TicketTable({ tickets, loading, onOpen, onRetry }) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="space-y-3 p-5"
        aria-label="Loading tickets"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} lines={2} />
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <EmptyState
        icon={Inbox}
        heading="Inbox zero!"
        description="No tickets match these filters. Try changing your search or clearing the filters."
        action={
          onRetry && (
            <Button variant="ghost" onClick={onRetry}>
              Clear filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-dashed border-muted bg-muted/40 font-body text-lg font-bold text-pencil">
              {[
                "Ticket",
                "Author",
                "Subject",
                "Category",
                "Priority",
                "Status",
                "Assignee",
                "Age",
                "Classified",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const isUnassignedCritical =
                ticket.priority === "Critical" && !ticket.assignedTo;
              return (
                <tr
                  key={ticket._id}
                  tabIndex={0}
                  onClick={() => onOpen(ticket)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(ticket);
                    }
                  }}
                  className={`cursor-pointer border-b border-muted/70 align-top text-lg text-pencil hover:bg-muted/25 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink-blue ${
                    ticket.isOverdue ? "border-l-4 border-l-accent" : ""
                  } ${isUnassignedCritical ? "bg-postit/50" : ""} ${ticket.isNew ? "animate-admin-new-ticket" : ""}`}
                >
                  <td className="px-3 py-4 font-bold">{ticket.ticketNumber}</td>
                  <td className="px-3 py-4">{ticket.author?.name ?? "—"}</td>
                  <td className="max-w-64 px-3 py-4">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="min-w-0 break-words font-bold">
                        {ticket.subject}
                      </span>
                      {ticket.isNew && (
                        <SectionTag className="border-ink-blue bg-white text-ink-blue">
                          NEW
                        </SectionTag>
                      )}
                      {ticket.isOverdue && (
                        <Badge variant="overdue">OVERDUE</Badge>
                      )}
                    </div>
                  </td>
                  <td className="max-w-48 px-3 py-4 text-lg">
                    {ticket.category}
                  </td>
                  <td className="px-3 py-4">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-3 py-4">
                    {ticket.assignedTo?.name ?? (
                      <span className="text-pencil/70">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-lg">
                    {timeAgo(ticket.createdAt)}
                  </td>
                  <td className="px-3 py-4">
                    <AiBadge
                      aiStatus={ticket.aiStatus}
                      classifiedByRules={ticket.classifiedByRules}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 p-3 md:hidden">
        {tickets.map((ticket) => (
          <li key={ticket._id}>
            <Card
              padding="p-0"
              className={`border-l-4 ${ticket.isOverdue ? "border-l-accent" : "border-l-pencil"} ${
                ticket.priority === "Critical" && !ticket.assignedTo
                  ? "bg-postit/50"
                  : ""
              } ${ticket.isNew ? "animate-admin-new-ticket" : ""}`}
            >
              <Button
                variant="ghost"
                type="button"
                onClick={() => onOpen(ticket)}
                className="min-h-0 w-full flex-col items-start gap-3 border-0 px-4 py-4 text-left font-normal text-pencil shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-transparent hover:text-pencil hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                <span className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className="font-heading text-xl font-bold">
                    {ticket.ticketNumber}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    {ticket.isNew && (
                      <SectionTag className="border-ink-blue bg-white text-ink-blue">
                        NEW
                      </SectionTag>
                    )}
                    {ticket.isOverdue && (
                      <Badge variant="overdue">OVERDUE</Badge>
                    )}
                  </span>
                </span>
                <span className="w-full break-words text-lg font-bold">
                  {ticket.subject}
                </span>
                <span className="w-full text-left text-lg">
                  {ticket.author?.name ?? "—"} · {ticket.category}
                </span>
                <span className="flex w-full flex-wrap items-center gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                  <AiBadge
                    aiStatus={ticket.aiStatus}
                    classifiedByRules={ticket.classifiedByRules}
                  />
                </span>
                <span className="flex w-full flex-wrap justify-between gap-2 text-lg text-pencil/70">
                  <span>
                    Assigned: {ticket.assignedTo?.name ?? "Unassigned"}
                  </span>
                  <time dateTime={ticket.createdAt}>
                    {timeAgo(ticket.createdAt)}
                  </time>
                </span>
              </Button>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [unassignedCount, setUnassignedCount] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [overdueResults, setOverdueResults] = useState([]);
  const [overduePage, setOverduePage] = useState(1);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [newTicketIds, setNewTicketIds] = useState(() => new Set());
  const filtersRef = useRef(filters);
  const searchRef = useRef(search);
  const pageRef = useRef(page);
  const quickFilterRef = useRef(quickFilter);
  const pollingRef = useRef(null);

  const requestParams = useCallback(
    (requestPage, requestFilters, requestSearch, limit = PAGE_SIZE) => {
      const params = { page: requestPage, limit, ...requestFilters };
      if (requestSearch) params.search = requestSearch;
      return params;
    },
    [],
  );

  const loadStats = useCallback(async () => {
    try {
      const [{ data: statsResponse }, { data: unassignedResponse }] =
        await Promise.all([
          adminApi.stats(),
          adminApi.listTickets({ assignedTo: "unassigned", page: 1, limit: 1 }),
        ]);
      setStats(statsResponse.data);
      setUnassignedCount(unassignedResponse.total ?? 0);
    } catch (err) {
      toast(apiError(err), { type: "error" });
    }
  }, [toast]);

  const loadTickets = useCallback(
    async (requestPage, requestFilters, requestSearch) => {
      try {
        const { data } = await adminApi.listTickets(
          requestParams(requestPage, requestFilters, requestSearch),
        );
        setTickets(data.data ?? []);
        setTotal(data.total ?? 0);
        setPage(requestPage);
        setQuickFilter("");
        setOverdueResults([]);
        setError("");
      } catch (err) {
        setError(apiError(err));
        toast(apiError(err), { type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [requestParams, toast],
  );

  const loadOverdue = useCallback(
    async (requestFilters, requestSearch) => {
      setOverdueLoading(true);
      try {
        const records = [];
        let requestPage = 1;
        let totalPages = 1;
        do {
          const { data } = await adminApi.listTickets(
            requestParams(
              requestPage,
              requestFilters,
              requestSearch,
              ALL_TICKET_LIMIT,
            ),
          );
          records.push(...(data.data ?? []));
          totalPages = data.pages ?? 1;
          requestPage += 1;
        } while (requestPage <= totalPages);

        const overdue = records.filter((ticket) => ticket.isOverdue);
        setOverdueResults(overdue);
        setTotal(overdue.length);
        setOverduePage(1);
        setPage(1);
        setQuickFilter("overdue");
        setError("");
      } catch (err) {
        setError(apiError(err));
        toast(apiError(err), { type: "error" });
      } finally {
        setOverdueLoading(false);
      }
    },
    [requestParams, toast],
  );

  const refreshCurrent = useCallback(() => {
    if (quickFilterRef.current === "overdue") {
      loadOverdue(filtersRef.current, searchRef.current);
    } else {
      loadTickets(pageRef.current, filtersRef.current, searchRef.current);
    }
  }, [loadOverdue, loadTickets]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.stats(),
      adminApi.listTickets({ assignedTo: "unassigned", page: 1, limit: 1 }),
    ])
      .then(([{ data: statsResponse }, { data: unassignedResponse }]) => {
        if (!active) return;
        setStats(statsResponse.data);
        setUnassignedCount(unassignedResponse.total ?? 0);
      })
      .catch((err) => {
        if (active) toast(apiError(err), { type: "error" });
      });
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    filtersRef.current = filters;
    searchRef.current = search;
    pageRef.current = page;
    quickFilterRef.current = quickFilter;
  }, [filters, page, quickFilter, search]);

  useEffect(() => {
    let active = true;
    adminApi
      .listTickets(requestParams(1, {}, ""))
      .then(({ data }) => {
        if (!active) return;
        setTickets(data.data ?? []);
        setTotal(data.total ?? 0);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(apiError(err));
        toast(apiError(err), { type: "error" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const socket = connectSocket(token);
    const ticketTimers = new Map();

    function onCreated(ticket) {
      if (ticket._id) {
        setNewTicketIds((current) => new Set(current).add(ticket._id));
        window.clearTimeout(ticketTimers.get(ticket._id));
        ticketTimers.set(
          ticket._id,
          window.setTimeout(() => {
            setNewTicketIds((current) => {
              const next = new Set(current);
              next.delete(ticket._id);
              return next;
            });
            ticketTimers.delete(ticket._id);
          }, 5000),
        );
      }
      toast(`New ticket: ${ticket.subject}`, { type: "info" });
      refreshCurrent();
      loadStats();
    }

    function onUpdated() {
      refreshCurrent();
      loadStats();
    }

    function onAiReady(ticket) {
      toast(`AI classification ready for ${ticket.ticketNumber}.`, {
        type: "success",
      });
      refreshCurrent();
    }

    socket.on("ticket:created", onCreated);
    socket.on("ticket:updated", onUpdated);
    socket.on("ticket:ai-ready", onAiReady);
    pollingRef.current = window.setInterval(() => {
      if (!socket.connected) {
        refreshCurrent();
        loadStats();
      }
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(pollingRef.current);
      socket.off("ticket:created", onCreated);
      socket.off("ticket:updated", onUpdated);
      socket.off("ticket:ai-ready", onAiReady);
      for (const timer of ticketTimers.values()) window.clearTimeout(timer);
      ticketTimers.clear();
    };
  }, [loadStats, refreshCurrent, requestParams, toast, token]);

  const activeFilters =
    Object.keys(filters).length > 0 || Boolean(search) || Boolean(quickFilter);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const visibleTickets =
    quickFilter === "overdue"
      ? overdueResults.slice(
          (overduePage - 1) * PAGE_SIZE,
          overduePage * PAGE_SIZE,
        )
      : tickets;
  const visibleWithNewState = visibleTickets.map((ticket) => ({
    ...ticket,
    isNew: newTicketIds.has(ticket._id),
  }));
  const isListLoading = loading || overdueLoading;

  function applyFilter(key, value) {
    const nextFilters = { ...filters };
    if (value) nextFilters[key] = value;
    else delete nextFilters[key];
    setFilters(nextFilters);
    setLoading(true);
    loadTickets(1, nextFilters, search);
  }

  function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    loadTickets(1, filters, search);
  }

  function clearFilters() {
    setFilters({});
    setSearch("");
    setLoading(true);
    loadTickets(1, {}, "");
  }

  function changePage(nextPage) {
    if (quickFilter === "overdue") {
      setOverduePage(nextPage);
      return;
    }
    setLoading(true);
    loadTickets(nextPage, filters, search);
  }

  function applyQuickFilter(kind) {
    if (kind === "overdue") {
      loadOverdue(filters, search);
      return;
    }
    const nextFilters = { ...filters };
    if (kind === "open") {
      nextFilters.status = nextFilters.status === "Open" ? undefined : "Open";
    } else if (kind === "in-progress") {
      nextFilters.status =
        nextFilters.status === "In Progress" ? undefined : "In Progress";
    } else if (kind === "critical") {
      nextFilters.priority =
        nextFilters.priority === "Critical" ? undefined : "Critical";
    } else if (kind === "unassigned") {
      nextFilters.assignedTo =
        nextFilters.assignedTo === "unassigned" ? undefined : "unassigned";
    }
    for (const key of Object.keys(nextFilters)) {
      if (!nextFilters[key]) delete nextFilters[key];
    }
    setFilters(nextFilters);
    setLoading(true);
    loadTickets(1, nextFilters, search);
  }

  const quickFilterPage = quickFilter === "overdue" ? overduePage : page;

  return (
    <div className="min-w-0 space-y-7">
      <header>
        <SectionTag>Admin workspace</SectionTag>
        <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-pencil md:text-5xl">
          Ticket Queue
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-pencil/75">
          Support inbox · {total} ticket{total !== 1 ? "s" : ""}
        </p>
      </header>

      <section
        aria-label="Ticket queue statistics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <StatTile
          label="Open"
          value={stats?.byStatus?.Open ?? 0}
          icon={CircleDot}
          active={filters.status === "Open"}
          onClick={() => applyQuickFilter("open")}
        />
        <StatTile
          label="In Progress"
          value={stats?.byStatus?.["In Progress"] ?? 0}
          icon={CircleCheck}
          active={filters.status === "In Progress"}
          onClick={() => applyQuickFilter("in-progress")}
        />
        <StatTile
          label="Critical"
          value={stats?.byPriority?.Critical ?? 0}
          icon={CircleAlert}
          active={filters.priority === "Critical"}
          onClick={() => applyQuickFilter("critical")}
        />
        <StatTile
          label="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          active={quickFilter === "overdue"}
          onClick={() => applyQuickFilter("overdue")}
        />
        <StatTile
          label="Unassigned"
          value={unassignedCount}
          icon={UsersRound}
          active={filters.assignedTo === "unassigned"}
          onClick={() => applyQuickFilter("unassigned")}
        />
      </section>

      <Card padding="p-4 sm:p-6" className="space-y-5 border-dashed">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter
              aria-hidden="true"
              className="h-6 w-6 text-ink-blue"
              strokeWidth={2.5}
            />
            <h2 className="font-heading text-2xl font-bold text-pencil">
              Find a ticket
            </h2>
          </div>
          {activeFilters && <SectionTag>Filters active</SectionTag>}
        </div>
        <form
          onSubmit={handleSearch}
          className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="queue-search" className="sr-only">
              Search tickets
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="queue-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by ticket number, subject, or message…"
                className="min-w-0"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                <Search
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={2.5}
                />
                Search
              </Button>
            </div>
          </div>
          <Select
            label="Status"
            value={filters.status ?? ""}
            onChange={(event) => applyFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
          <Select
            label="Category"
            value={filters.category ?? ""}
            onChange={(event) => applyFilter("category", event.target.value)}
          >
            <option value="">All categories</option>
            {TICKET_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={filters.priority ?? ""}
            onChange={(event) => applyFilter("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </Select>
          <Select
            label="Assignee"
            value={filters.assignedTo ?? ""}
            onChange={(event) => applyFilter("assignedTo", event.target.value)}
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {user?.id && <option value={user.id}>Assigned to me</option>}
          </Select>
          <Input
            label="From date"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) => applyFilter("dateFrom", event.target.value)}
          />
          <Input
            label="To date"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) => applyFilter("dateTo", event.target.value)}
          />
          <div className="flex items-end sm:col-span-2 xl:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              disabled={!activeFilters}
              className="w-full sm:w-auto"
            >
              Clear filters
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <Card
          role="alert"
          padding="p-4"
          className="flex flex-wrap items-center justify-between gap-4 border-accent"
        >
          <p className="text-lg leading-relaxed text-[#b91c1c]">
            Could not load the queue: {error}
          </p>
          <Button variant="ghost" onClick={refreshCurrent}>
            Retry
          </Button>
        </Card>
      )}

      <Card padding="p-0" className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-muted px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <UserRound
              aria-hidden="true"
              className="h-5 w-5 text-ink-blue"
              strokeWidth={2.5}
            />
            <h2 className="font-heading text-2xl font-bold text-pencil">
              {quickFilter === "overdue" ? "Overdue tickets" : "All tickets"}
            </h2>
          </div>
          <SectionTag>
            {total} result{total !== 1 ? "s" : ""}
          </SectionTag>
        </div>
        {quickFilter === "overdue" &&
        !isListLoading &&
        overdueResults.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            heading="No overdue tickets"
            description="Everything is within its response window."
          />
        ) : (
          <TicketTable
            tickets={visibleWithNewState}
            loading={isListLoading}
            onOpen={(ticket) => navigate(`/admin/tickets/${ticket._id}`)}
            onRetry={activeFilters ? clearFilters : undefined}
          />
        )}
      </Card>

      {totalPages > 1 && (
        <nav
          aria-label="Ticket queue pagination"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            disabled={quickFilterPage <= 1 || isListLoading}
            onClick={() => changePage(quickFilterPage - 1)}
            aria-label="Previous page"
            className="h-12 w-12 p-0"
          >
            <ChevronLeft
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.5}
            />
          </Button>
          {Array.from(
            { length: Math.min(totalPages, 7) },
            (_, index) => index + 1,
          ).map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === quickFilterPage ? "primary" : "ghost"}
              onClick={() => changePage(pageNumber)}
              aria-current={pageNumber === quickFilterPage ? "page" : undefined}
              className="h-12 w-12 p-0"
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            disabled={quickFilterPage >= totalPages || isListLoading}
            onClick={() => changePage(quickFilterPage + 1)}
            aria-label="Next page"
            className="h-12 w-12 p-0"
          >
            <ChevronRight
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.5}
            />
          </Button>
        </nav>
      )}
    </div>
  );
}
