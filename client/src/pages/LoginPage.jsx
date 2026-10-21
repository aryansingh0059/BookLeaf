import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, KeyRound, Leaf } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import { wobbly } from "../theme/wobbly.js";

const demoAccounts = [
  { label: "Admin", email: "admin@bookleaf.com", password: "Admin@123" },
  {
    label: "Priya (author)",
    email: "priya.sharma@email.com",
    password: "Author@123",
  },
  {
    label: "Ananya (author)",
    email: "ananya.reddy@email.com",
    password: "Author@123",
  },
];

/**
 * Use as the public sign-in page; demo account buttons only prefill the existing login form.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/author/books", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Login failed. Please try again.",
      );
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
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center px-3 py-3 text-pencil focus-visible:outline-none sm:px-4 sm:py-4"
    >
      <Card decoration="tack" className="w-full max-w-lg p-6 md:p-8">
        <div className="mb-2 flex justify-center">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center border-2 border-dashed border-ink-blue bg-white text-ink-blue"
            style={{ borderRadius: wobbly }}
          >
            <BookOpen className="h-5 w-5" strokeWidth={2.5} />
          </span>
        </div>
        <p className="mb-0.5 text-center font-body text-base font-bold text-ink-blue">
          Author &amp; Admin Support System
        </p>
        <h1 className="text-center font-heading text-3xl font-bold leading-tight md:text-4xl">
          Welcome back<span className="login-mark inline-block">!</span>
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-3 border-2 border-accent bg-white p-3 text-lg leading-relaxed text-[#b91c1c]"
            style={{ borderRadius: wobbly }}
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-1 h-5 w-5 shrink-0"
              strokeWidth={2.5}
            />
            <span>{error}</span>
          </div>
        )}

        <div className="relative mt-4">
          <svg
            aria-hidden="true"
            viewBox="0 0 140 90"
            className="pointer-events-none absolute -left-6 bottom-0 hidden h-20 w-20 text-accent md:block"
          >
            <path
              d="M8 8c10 26 43 48 102 55m-20-16 22 18-25 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="7 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="!font-mono !text-base"
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
              className="!font-mono !text-base"
            />
            <Button type="submit" loading={loading} className="w-full text-xl">
              Sign In
            </Button>
          </form>
        </div>

        <Card
          tone="postit"
          padding="p-3"
          className="mt-4"
          aria-labelledby="demo-credentials-heading"
        >
          <h2
            id="demo-credentials-heading"
            className="mb-1.5 flex items-center gap-2 font-heading text-lg font-bold"
          >
            <KeyRound
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.5}
            />
            Demo credentials
          </h2>
          <div className="space-y-1">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                variant="ghost"
                type="button"
                onClick={(event) => fillDemo(event, account)}
                className="w-full justify-start whitespace-normal border-pencil/50 bg-white/70 px-2 py-1 text-left font-body text-sm font-normal"
              >
                <Leaf
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-ink-blue"
                  strokeWidth={2.5}
                />
                <span className="shrink-0 font-bold">{account.label}:</span>
                <span className="min-w-0 break-all font-mono text-xs leading-5 [user-select:text]">
                  {account.email} / {account.password}
                </span>
              </Button>
            ))}
          </div>
        </Card>
      </Card>
    </main>
  );
}
