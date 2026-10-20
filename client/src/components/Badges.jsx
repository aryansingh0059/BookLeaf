import { Badge } from './ui/Badge.jsx';

const statusVariants = {
  Open: 'open',
  'In Progress': 'in-progress',
  Resolved: 'resolved',
  Closed: 'closed',
};

const priorityVariants = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

/** Use as a compatibility wrapper for status labels backed by the shared UI Badge. */
export function StatusBadge({ status }) {
  return <Badge variant={statusVariants[status] ?? 'default'}>{status}</Badge>;
}

/** Use as a compatibility wrapper for priority labels backed by the shared UI Badge. */
export function PriorityBadge({ priority }) {
  return <Badge variant={priorityVariants[priority] ?? 'default'}>{priority}</Badge>;
}

/** Use to show whether the ticket was classified by AI, rules, or is still pending. */
export function AiBadge({ aiStatus, classifiedByRules }) {
  if (!aiStatus) return null;
  if (aiStatus === 'done') return <Badge variant="ai" />;
  if (classifiedByRules || aiStatus === 'failed' || aiStatus === 'skipped') {
    return <Badge variant="rules" title="AI unavailable, classified by rules, please review" />;
  }
  if (aiStatus === 'pending') return <Badge variant="pending" />;
  return null;
}

/** Use to mark overdue tickets; renders nothing when the ticket is not overdue. */
export function OverdueBadge({ isOverdue }) {
  if (!isOverdue) return null;
  return <Badge variant="overdue" />;
}
