import { useState } from 'react';
import { BookOpen, Inbox, Sparkles } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  SectionTag,
  Select,
  Skeleton,
  Spinner,
  SquiggleUnderline,
  Textarea,
  useToast,
} from '../../components/ui/index.js';

/** Groups preview examples by component family for the temporary development UI kit. */
function ShowcaseSection({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-3xl text-pencil">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

export default function UiKitPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 text-pencil md:px-8">
      <header className="space-y-3">
        <SectionTag>Temporary development preview</SectionTag>
        <h1 className="font-heading text-5xl">
          <SquiggleUnderline>BookLeaf UI Kit</SquiggleUnderline>
        </h1>
        <p className="text-xl leading-relaxed">Shared hand-drawn components, shown with common states.</p>
      </header>

      <ShowcaseSection title="Buttons">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </ShowcaseSection>

      <ShowcaseSection title="Cards">
        <Card decoration="tape" tilt={-2} className="max-w-xs">
          <h3 className="font-heading text-2xl">Paper card</h3>
          <p className="text-lg leading-relaxed">Decorative card with tape and a small tilt.</p>
        </Card>
        <Card decoration="tack" tone="postit" tilt={1} className="max-w-xs">
          <h3 className="font-heading text-2xl">Post-it card</h3>
          <p className="text-lg leading-relaxed">A tack and yellow paper tone.</p>
        </Card>
        <Card className="max-w-xs">
          <h3 className="font-heading text-2xl">No decoration</h3>
          <p className="text-lg leading-relaxed">Dense content stays unrotated.</p>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="Form fields">
        <div className="grid w-full gap-6 md:grid-cols-2">
          <Input label="Author name" placeholder="Your name" helperText="A short helper message." />
          <Input label="Email" placeholder="name@example.com" error="Enter a valid email address." />
          <Textarea label="Message" placeholder="Write your question…" helperText="Be as specific as you can." />
          <Select label="Ticket status" defaultValue="open">
            <option value="open">Open</option>
            <option value="progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Badges">
        <Badge variant="open" />
        <Badge variant="in-progress" />
        <Badge variant="resolved" />
        <Badge variant="closed" />
        <Badge variant="critical" />
        <Badge variant="high" />
        <Badge variant="medium" />
        <Badge variant="low" />
        <Badge variant="ai" />
        <Badge variant="rules" />
        <Badge variant="pending" />
        <Badge variant="overdue" />
      </ShowcaseSection>

      <ShowcaseSection title="Dialogs and notifications">
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Open confirmation</Button>
        <Button variant="ghost" onClick={() => toast('Your changes were saved.', { type: 'success' })}>Show toast</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="A paper modal" description="Focus stays inside this dialog. Press Escape to close it.">
          <Button onClick={() => setModalOpen(false)}>Close modal</Button>
        </Modal>
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            toast('Confirmed. Nothing was sent.', { type: 'success' });
          }}
          title="Send this reply?"
          description="This preview only demonstrates the confirmation component."
          confirmLabel="Confirm"
        />
      </ShowcaseSection>

      <ShowcaseSection title="Loading and empty states">
        <Spinner label="Loading preview" />
        <div className="w-full max-w-sm space-y-3">
          <Skeleton lines={3} />
          <Skeleton circle />
        </div>
        <EmptyState
          icon={Inbox}
          heading="Inbox zero!"
          description="A clear, friendly empty state with an optional action."
          action={<Button onClick={() => toast('Preview action selected.')}>Take a look</Button>}
        />
      </ShowcaseSection>

      <ShowcaseSection title="Section labels and decoration">
        <SectionTag><Sparkles aria-hidden="true" strokeWidth={2.5} /> New section</SectionTag>
        <span className="font-heading text-3xl"><SquiggleUnderline color="#2d5da1">Underlined heading</SquiggleUnderline></span>
        <BookOpen aria-hidden="true" className="h-8 w-8" strokeWidth={2.5} />
      </ShowcaseSection>
    </main>
  );
}
