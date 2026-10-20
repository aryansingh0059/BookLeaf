import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const MyBooksPage = lazy(() => import('./pages/author/MyBooksPage.jsx'));
const MyTicketsPage = lazy(() => import('./pages/author/MyTicketsPage.jsx'));
const SubmitQueryPage = lazy(() => import('./pages/author/SubmitQueryPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminTicketDetailPage = lazy(() => import('./pages/admin/AdminTicketDetailPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const UiKitPage = lazy(() => import('./pages/dev/UiKitPage.jsx'));

function RouteLoading() {
  return (
    <div id="main-content" tabIndex={-1} role="status" aria-live="polite" className="p-8 text-center text-lg text-pencil focus-visible:outline-none">
      Loading page…
    </div>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/author/books'} replace />;
}

function AppShell({ children }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-4rem)] px-3 py-6 focus-visible:outline-none md:px-6 md:py-8">
        {/* Admin tables need the extra width; author pages stay within the design system's max-w-5xl. */}
        <div className={`mx-auto w-full ${isAdmin ? 'max-w-7xl' : 'max-w-5xl'}`}>
          {children}
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <a
            href="#main-content"
            className="sr-only z-[300] border-2 border-pencil bg-white p-3 font-body text-lg font-bold text-pencil focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ink-blue"
          >
            Skip to main content
          </a>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1e28',
                color: '#e8eaf0',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RootRedirect />} />
              <Route
                path="/ui-kit"
                element={import.meta.env.DEV ? <UiKitPage /> : <Navigate to="/" replace />}
              />

              {/* Author routes */}
              <Route
                path="/author/*"
                element={
                  <ProtectedRoute role="author">
                    <AppShell>
                      <Routes>
                        <Route path="books" element={<MyBooksPage />} />
                        <Route path="tickets" element={<MyTicketsPage />} />
                        <Route path="tickets/new" element={<SubmitQueryPage />} />
                        <Route path="*" element={<Navigate to="/author/books" replace />} />
                      </Routes>
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute role="admin">
                    <AppShell>
                      <Routes>
                        <Route path="" element={<AdminDashboardPage />} />
                        <Route path="tickets/:id" element={<AdminTicketDetailPage />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                      </Routes>
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
