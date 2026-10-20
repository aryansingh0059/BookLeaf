import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Navbar } from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MyBooksPage from './pages/author/MyBooksPage.jsx';
import MyTicketsPage from './pages/author/MyTicketsPage.jsx';
import SubmitQueryPage from './pages/author/SubmitQueryPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminTicketDetailPage from './pages/admin/AdminTicketDetailPage.jsx';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/author/books'} replace />;
}

function AppShell({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
