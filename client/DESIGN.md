# BookLeaf Frontend Design System

The client uses Tailwind CSS and the shared components in `src/components/ui/` for a playful, hand-drawn paper interface. Keep visual changes consistent with these tokens and accessibility decisions.

## Tokens

| Token | Value | Use |
|---|---|---|
| Paper | `#fdfbf7` | Page background |
| Pencil | `#2d2d2d` | Text and primary borders |
| Muted | `#e5e0d8` | Secondary fills and separators |
| Accent | `#ff4d4d` | Errors, critical states, admin accents |
| Ink blue | `#2d5da1` | Focus, author accents, in-progress states |
| Post-it | `#fff9c4` | Notes and pending highlights |
| White | `#ffffff` | Cards and form controls |

Typography is Kalam 700 for headings and Patrick Hand 400 for body copy. Both Google Fonts use `display=swap`. Body copy defaults to 18px with 1.5 line-height.

Use the radius constants from `src/theme/wobbly.js`: `wobbly`, `wobblyMd`, `wobblyAlt`, and `wobblySoft`. Do not use a plain Tailwind `rounded-*` utility for interface surfaces. Shadows are hard, offset-only; cards use a subtle 3px offset shadow.

## Shared component API

| Component | API | Purpose |
|---|---|---|
| `Button` | `variant` (`primary`, `secondary`, `danger`, `ghost`), `loading`, `disabled`, native button props | Actions; minimum 48px tall |
| `Card` | `decoration` (`tape`, `tack`, `none`), `tone` (`paper`, `postit`), `tilt` (-2 to 2), `padding`, native section props | Paper or post-it surfaces |
| `Input` | `id`, `label`, `helperText`, `error`, native input props | Labelled single-line fields |
| `Textarea` | `id`, `label`, `helperText`, `error`, native textarea props | Labelled multiline fields |
| `Select` | `id`, `label`, `helperText`, `error`, options as children, native select props | Labelled choice fields |
| `Badge` | `variant`, optional `children`, `title`, `className` | One icon-and-word badge system for statuses, priorities, classification, and overdue state |
| `Modal` | `open`, `onClose`, `title`, `description`, `closeOnOverlay`, `className`, children | Accessible modal with focus containment and Escape handling |
| `ConfirmDialog` | `open`, `onClose`, `onConfirm`, `title`, `description`, `confirmLabel`, `cancelLabel`, `loading`, children | Confirmation before externally visible or irreversible actions |
| `ToastProvider` / `useToast` | `toast(message, { type, duration })`, `dismiss()` | Auto-dismissing, non-focus-stealing status notifications |
| `Toast` | `message`, `type`, `onDismiss` | Post-it toast surface; normally rendered by the provider |
| `Spinner` | `label`, `size`, `className` | Scribble loader; provide a label when it conveys status |
| `Skeleton` | `lines`, `circle`, `className` | Dashed loading placeholders |
| `EmptyState` | `icon`, `heading`, `description`, `action`, `className` | Empty collections and results |
| `SectionTag` | children, `className`, span props | Compact sticky-note section label |

The `StatusBadge`, `PriorityBadge`, `AiBadge`, and `OverdueBadge` exports in `src/components/Badges.jsx` are compatibility wrappers around the shared `Badge`, not separate visual systems.

## Usage rules

- Import reusable controls from `src/components/ui/`; do not hand-roll buttons, cards, inputs, selects, textareas, or badges.
- Use `Card` tilt only for decorative or summary cards. Keep tilt at zero for forms, filters, tables, rows, ticket threads, and other dense data. Mobile tilt is clamped to ±1 degree.
- Do not communicate status or priority by color alone. Keep the word and icon visible.
- Use `max-w-5xl` for author pages. Admin pages can use `max-w-7xl` where tables need the width.
- Keep touch targets at least 48px, body copy at least 18px, and page headings `text-4xl md:text-5xl`.
- Hide decorative arrows and underlines on narrow screens. Avoid page-level horizontal overflow; constrain wide tables to their own scroll region.
- Keep motion inside `prefers-reduced-motion: no-preference` or Tailwind `motion-safe` utilities.

## Accessibility decisions

- Every form field has a visible, associated label. Helper and error text are connected with `aria-describedby`; invalid fields set `aria-invalid`.
- Interactive elements have visible keyboard focus. The app provides a skip-to-main-content link.
- Modals use `role="dialog"` and `aria-modal="true"`, contain keyboard focus, close on Escape, and restore focus when dismissed.
- Toasts and asynchronous loading/live updates use status or live-region semantics without stealing focus.
- Decorative icons and SVGs are hidden from assistive technology; icon-only controls have accessible names.
- Badges include an icon and text label. Critical/overdue badges use bold, large text on the accent fill; other status and priority distinctions are not color-only.
