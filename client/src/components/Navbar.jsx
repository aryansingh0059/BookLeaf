import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Leaf, Menu, Wifi, WifiOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { disconnectSocket, getSocket } from '../socket/socketClient.js';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { wobblyMd } from '../theme/wobbly.js';

function ConnectionIndicator() {
  const [connection, setConnection] = useState('reconnecting');

  useEffect(() => {
    let currentSocket;
    let manager;

    function updateConnection() {
      currentSocket = getSocket();
      if (!currentSocket) {
        setConnection('reconnecting');
        return;
      }

      setConnection(
        currentSocket.connected
          ? currentSocket.io.engine?.transport?.name === 'polling' ? 'polling' : 'live'
          : 'reconnecting',
      );
    }

    const timer = window.setInterval(() => {
      const nextSocket = getSocket();
      if (nextSocket !== currentSocket) {
        currentSocket?.off('connect', updateConnection);
        currentSocket?.off('disconnect', updateConnection);
        currentSocket?.off('connect_error', updateConnection);
        manager?.off('reconnect_attempt', updateConnection);
        currentSocket = nextSocket;
        if (currentSocket) {
          currentSocket.on('connect', updateConnection);
          currentSocket.on('disconnect', updateConnection);
          currentSocket.on('connect_error', updateConnection);
          manager = currentSocket.io;
          manager.on('reconnect_attempt', updateConnection);
        }
      }
      updateConnection();
    }, 500);

    return () => {
      window.clearInterval(timer);
      currentSocket?.off('connect', updateConnection);
      currentSocket?.off('disconnect', updateConnection);
      currentSocket?.off('connect_error', updateConnection);
      manager?.off('reconnect_attempt', updateConnection);
    };
  }, []);

  const status = {
    live: { label: 'Live connection', dot: 'bg-ink-blue', Icon: Wifi },
    polling: { label: 'Polling fallback', dot: 'bg-postit', Icon: Wifi },
    reconnecting: { label: 'Reconnecting', dot: 'border-2 border-dashed border-accent bg-white', Icon: WifiOff },
  }[connection];
  const Icon = status.Icon;

  return (
    <span
      title={status.label}
      aria-label={`Socket connection: ${status.label}`}
      role="status"
      className="inline-flex min-h-12 items-center gap-2 px-2 text-base text-pencil"
    >
      <span aria-hidden="true" className={`grid h-8 w-8 place-items-center border-2 border-pencil ${status.dot}`} style={{ borderRadius: wobblyMd }}>
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="hidden lg:inline">{status.label}</span>
    </span>
  );
}

function NavItems({ isAdmin, onNavigate }) {
  const links = isAdmin
    ? [{ to: '/admin', label: 'Dashboard', end: true }, { to: '/admin/tickets', label: 'Tickets' }]
    : [
        { to: '/author/books', label: 'My Books' },
        { to: '/author/tickets', label: 'My Tickets' },
        { to: '/author/tickets/new', label: 'Submit Query' },
      ];

  return links.map(({ to, label, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `relative inline-flex min-h-12 items-center px-3 font-body text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/20 ${isActive ? 'text-pencil' : 'text-pencil/70 hover:text-pencil'}`}
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <svg aria-hidden="true" viewBox="0 0 120 10" preserveAspectRatio="none" className="absolute inset-x-2 bottom-1 h-2 w-[calc(100%-1rem)]">
              <path d="M2 6c10-5 16 3 26 0s16-3 26 0 16 3 26-1 16-3 26 1 12 0 14-1" fill="none" stroke={isAdmin ? '#ff4d4d' : '#2d5da1'} strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </>
      )}
    </NavLink>
  ));
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const previousFocus = document.activeElement;
    const drawer = drawerRef.current;
    const focusable = () => drawer?.querySelectorAll('a[href], button:not(:disabled)') ?? [];
    focusable()[0]?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
      } else if (event.key === 'Tab') {
        const items = focusable();
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
          event.preventDefault();
          items[0].focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [drawerOpen]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const accentClass = isAdmin ? 'border-accent' : 'border-ink-blue';

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b-2 bg-paper/95 ${accentClass}`}
        style={{ borderRadius: wobblyMd }}
      >
        <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2 md:px-6">
          <Link to={isAdmin ? '/admin' : '/author/books'} className="flex min-h-12 shrink-0 items-center gap-2 text-pencil focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/20">
            <Leaf aria-hidden="true" className={`h-7 w-7 ${isAdmin ? 'text-accent' : 'text-ink-blue'}`} strokeWidth={2.5} />
            <span className="font-heading text-3xl font-bold leading-none">BookLeaf</span>
          </Link>
          <span className="hidden md:inline"><Badge variant={isAdmin ? 'high' : 'in-progress'}>{isAdmin ? 'Ops' : 'Author'}</Badge></span>

          <div className="hidden flex-1 items-center gap-2 lg:flex">
            <NavItems isAdmin={isAdmin} />
          </div>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <ConnectionIndicator />
            <span className="max-w-40 truncate font-body text-lg font-bold text-pencil">{user.name}</span>
            <Badge variant={isAdmin ? 'high' : 'in-progress'}>{isAdmin ? 'Ops' : 'Author'}</Badge>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <ConnectionIndicator />
            <Button
              variant="ghost"
              type="button"
              aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={drawerOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setDrawerOpen(true)}
              className="h-12 w-12 min-h-12 p-0"
            >
              {drawerOpen ? <X aria-hidden="true" strokeWidth={2.5} /> : <Menu aria-hidden="true" strokeWidth={2.5} />}
            </Button>
          </div>
        </nav>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-pencil/40 p-3 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDrawerOpen(false);
          }}
        >
          <aside
            id="mobile-navigation-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="ml-auto flex h-full w-full max-w-sm flex-col gap-5 border-2 border-pencil bg-white p-5 text-pencil shadow-hard-lg"
            style={{ borderRadius: wobblyMd }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Leaf aria-hidden="true" className={`h-7 w-7 ${isAdmin ? 'text-accent' : 'text-ink-blue'}`} strokeWidth={2.5} />
                <span className="font-heading text-3xl font-bold">BookLeaf</span>
              </div>
              <Button
                variant="ghost"
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
                className="h-12 w-12 min-h-12 p-0"
              >
                <X aria-hidden="true" strokeWidth={2.5} />
              </Button>
            </div>
            <Badge variant={isAdmin ? 'high' : 'in-progress'}>{isAdmin ? 'Ops portal' : 'Author portal'}</Badge>
            <div className="flex flex-col items-stretch">
              <NavItems isAdmin={isAdmin} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="mt-auto space-y-3 border-t-2 border-dashed border-muted pt-4">
              <p className="font-body text-lg font-bold">{user.name}</p>
              <Button variant="ghost" className="w-full" onClick={handleLogout}>Logout</Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
