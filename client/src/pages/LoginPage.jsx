import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, KeyRound, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { wobbly } from '../theme/wobbly.js';

const demoAccounts = [
  { label: 'Admin', email: 'admin@bookleaf.com', password: 'Admin@123' },
  { label: 'Priya Sharma', email: 'priya.sharma@email.com', password: 'Author@123' },
  { label: 'Ananya Reddy', email: 'ananya.reddy@email.com', password: 'Author@123' },
];

/**
 * Use as the public sign-in page; demo account buttons only prefill the existing login form.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/author/books', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(event, account) {
    event.preventDefault();
    setEmail(account.email);
    setPassword(account.password);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-pencil">
      <Card decoration="tack" className="w-full max-w-xl p-6 pt-10 sm:p-10 sm:pt-12">
        <div className="mb-4 flex justify-center">
          <span
            aria-hidden="true"
            className="grid h-16 w-16 place-items-center border-2 border-dashed border-ink-blue bg-white text-ink-blue"
            style={{ borderRadius: wobbly }}
          >
            <BookOpen className="h-8 w-8" strokeWidth={2.5} />
          </span>
        </div>
        <p className="mb-1 text-center font-body text-lg font-bold text-ink-blue">Author &amp; Admin Support System</p>
        <h1 className="text-center font-heading text-4xl font-bold leading-tight sm:text-5xl">
          Welcome back<span className="login-mark inline-block">!</span>
        </h1>
        <p className="mt-2 text-center text-lg leading-relaxed">Sign in to your BookLeaf portal.</p>

        {error && (
          <div role="alert" className="mt-6 flex items-start gap-3 border-2 border-accent bg-white p-3 text-lg leading-relaxed text-[#b91c1c]" style={{ borderRadius: wobbly }}>
            <AlertCircle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" strokeWidth={2.5} />
            <span>{error}</span>
          </div>
        )}

        <div className="relative mt-8">
          <svg aria-hidden="true" viewBox="0 0 140 90" className="pointer-events-none absolute -left-24 top-16 hidden h-24 w-32 text-accent md:block">
            <path d="M8 8c10 26 43 48 102 55m-20-16 22 18-25 7" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              autoFocus
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full text-2xl">
              Sign In
            </Button>
          </form>
        </div>

        <aside className="mt-8 border-2 border-pencil bg-postit p-4 shadow-hard-sm" style={{ borderRadius: wobbly }}>
          <h2 className="mb-2 flex items-center gap-2 font-heading text-2xl font-bold">
            <KeyRound aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
            Demo credentials
          </h2>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                variant="ghost"
                type="button"
                onClick={(event) => fillDemo(event, account)}
                className="w-full justify-start whitespace-normal border-pencil/50 bg-white/70 px-3 py-2 text-left font-body text-lg font-normal"
              >
                <Leaf aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-blue" strokeWidth={2.5} />
                <span className="shrink-0 font-bold">{account.label}</span>
                <span className="min-w-0 break-all">{account.email} / {account.password}</span>
              </Button>
            ))}
          </div>
        </aside>
      </Card>
    </main>
  );
}
