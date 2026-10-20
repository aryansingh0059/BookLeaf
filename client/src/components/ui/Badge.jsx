import {
  AlertCircle,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Circle,
  Clock3,
  HelpCircle,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { wobblyAlt } from '../../theme/wobbly.js';

const variants = {
  open: { label: 'Open', icon: Circle, className: 'border-2 border-dashed border-pencil bg-white text-pencil' },
  'in-progress': { label: 'In Progress', icon: Clock3, className: 'border-2 border-ink-blue bg-white text-ink-blue' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'border-2 border-pencil bg-postit text-pencil' },
  closed: { label: 'Closed', icon: Archive, className: 'border-2 border-muted bg-muted text-pencil' },
  critical: { label: 'Critical', icon: AlertTriangle, className: 'border-2 border-accent bg-accent text-white text-xl' },
  high: { label: 'High', icon: AlertCircle, className: 'border-2 border-accent bg-white text-pencil' },
  medium: { label: 'Medium', icon: Circle, className: 'border-2 border-pencil bg-postit text-pencil' },
  low: { label: 'Low', icon: Circle, className: 'border-2 border-muted bg-muted text-pencil' },
  ai: { label: 'AI classified', icon: Sparkles, className: 'border-2 border-ink-blue bg-white text-ink-blue' },
  rules: { label: 'Rules fallback', icon: AlertTriangle, className: 'border-2 border-dashed border-accent bg-white text-pencil' },
  pending: { label: 'AI pending', icon: Clock3, className: 'border-2 border-dashed border-pencil bg-muted text-pencil' },
  overdue: { label: 'Overdue', icon: AlertTriangle, className: 'border-2 border-accent bg-accent text-white text-xl' },
  default: { label: '', icon: HelpCircle, className: 'border-2 border-pencil bg-white text-pencil' },
};

/**
 * Use for status, priority, classification, and overdue labels; every semantic badge includes an icon and word.
 */
export function Badge({ variant = 'default', children, className = '', title, ...props }) {
  const config = variants[variant] ?? variants.default;
  const Icon = config.icon;
  const label = children ?? (config.label || String(variant));

  return (
    <span
      {...props}
      title={title}
      style={{ borderRadius: wobblyAlt, ...props.style }}
      className={`inline-flex min-h-8 items-center gap-1.5 border px-3 py-1 font-body text-lg font-bold leading-none ${config.className} ${className}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <span>{label}</span>
      {variant === 'resolved' && <StickyNote aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />}
    </span>
  );
}
