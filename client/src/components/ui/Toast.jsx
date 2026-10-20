import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import { wobblyMd } from '../../theme/wobbly.js';

/**
 * Use from ToastProvider; controlled rendering is useful for isolated component previews.
 */
export function Toast({ message, type = 'info', onDismiss }) {
  const icons = { success: CircleCheck, error: CircleX, info: Info };
  const Icon = icons[type] ?? icons.info;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ borderRadius: wobblyMd }}
      className="fixed right-4 top-4 z-[200] flex max-w-sm items-start gap-3 border-2 border-pencil bg-postit p-4 text-lg leading-relaxed text-pencil shadow-hard"
    >
      <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" strokeWidth={2.5} />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="grid h-12 w-12 shrink-0 place-items-center border-2 border-dashed border-pencil bg-white"
          style={{ borderRadius: wobblyMd }}
        >
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
