import { Inbox } from 'lucide-react';
import { wobbly } from '../../theme/wobbly.js';
import { Button } from './Button.jsx';

/**
 * Use when a page has no content; customize the icon, message, and optional action.
 */
export function EmptyState({
  icon: Icon = Inbox,
  heading,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center gap-4 px-6 py-10 text-center ${className}`}>
      <span
        aria-hidden="true"
        style={{ borderRadius: wobbly }}
        className="grid h-20 w-20 place-items-center border-2 border-dashed border-ink-blue bg-white text-ink-blue"
      >
        <Icon className="h-9 w-9" strokeWidth={2.5} />
      </span>
      {heading && <h2 className="font-heading text-3xl text-pencil">{heading}</h2>}
      {description && <p className="max-w-xl text-lg leading-relaxed text-pencil/80">{description}</p>}
      {action && (typeof action === 'string'
        ? <Button>{action}</Button>
        : action)}
    </div>
  );
}
