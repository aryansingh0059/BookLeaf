export function StatusBadge({ status }) {
  const map = {
    Open: { label: 'Open', cls: 'badge-open' },
    'In Progress': { label: 'In Progress', cls: 'badge-in-progress' },
    Resolved: { label: 'Resolved', cls: 'badge-resolved' },
    Closed: { label: 'Closed', cls: 'badge-closed' },
  };
  const b = map[status] ?? { label: status, cls: 'badge-default' };
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    Critical: 'badge-critical',
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  };
  return <span className={`badge ${map[priority] ?? 'badge-default'}`}>{priority}</span>;
}

export function AiBadge({ aiStatus, classifiedByRules }) {
  if (!aiStatus) return null;
  if (aiStatus === 'done') {
    return <span className="badge badge-ai-done">AI classified</span>;
  }
  if (classifiedByRules || aiStatus === 'failed' || aiStatus === 'skipped') {
    return (
      <span className="badge badge-ai-rules" title="AI unavailable, classified by rules, please review">
        ⚠ Rules fallback
      </span>
    );
  }
  if (aiStatus === 'pending') {
    return <span className="badge badge-ai-pending">AI pending…</span>;
  }
  return null;
}

export function OverdueBadge({ isOverdue }) {
  if (!isOverdue) return null;
  return <span className="badge badge-overdue">Overdue</span>;
}
