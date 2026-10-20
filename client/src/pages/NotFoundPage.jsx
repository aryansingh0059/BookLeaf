import { useNavigate } from 'react-router-dom';
import { CircleHelp, House } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { wobbly } from '../theme/wobbly.js';

/**
 * Use for unknown URLs; return users to the existing root redirect without changing portal logic.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center px-4 py-10 text-center text-pencil focus-visible:outline-none">
      <Card decoration="tack" className="w-full max-w-xl p-8 pt-12">
        <span
          aria-hidden="true"
          className="mx-auto grid h-20 w-20 place-items-center border-2 border-dashed border-accent text-accent"
          style={{ borderRadius: wobbly }}
        >
          <CircleHelp className="h-10 w-10" strokeWidth={2.5} />
        </span>
        <p className="mt-5 font-heading text-5xl font-bold">404</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">Page not found</h1>
        <p className="mt-3 text-xl leading-relaxed">Looks like this page wandered off the paper.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>
          <House aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
          Back home
        </Button>
      </Card>
    </main>
  );
}
