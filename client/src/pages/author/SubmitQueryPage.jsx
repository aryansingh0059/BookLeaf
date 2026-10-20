import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Paperclip, Send, UploadCloud } from 'lucide-react';
import { booksApi, ticketsApi } from '../../api/endpoints.js';
import { apiError } from '../../utils/constants.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTag } from '../../components/ui/SectionTag.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { useToast } from '../../components/ui/useToast.js';
import { wobbly, wobblyAlt } from '../../theme/wobbly.js';

const MAX_SUBJECT = 150;
const MAX_DESC = 5000;

export default function SubmitQueryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    booksApi.list()
      .then(({ data }) => setBooks(data.data ?? []))
      .catch((err) => toast(apiError(err), { type: 'error' }));
  }, [toast]);

  function validate() {
    const nextErrors = {};
    if (subject.trim().length < 3) nextErrors.subject = 'Subject must be at least 3 characters.';
    if (subject.trim().length > MAX_SUBJECT) nextErrors.subject = `Subject must be at most ${MAX_SUBJECT} characters.`;
    if (description.trim().length < 10) nextErrors.description = 'Description must be at least 10 characters.';
    if (description.trim().length > MAX_DESC) nextErrors.description = `Description must be at most ${MAX_DESC} characters.`;
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const attachments = files.map((file) => ({ name: file.name, size: file.size, type: file.type }));
      const { data } = await ticketsApi.create({
        bookId: bookId || null,
        subject: subject.trim(),
        description: description.trim(),
        attachments,
      });
      const ticketNum = data.data?.ticketNumber ?? 'your ticket';
      toast(
        <span className="flex flex-col gap-1">
          <span>{`Ticket ${ticketNum} submitted! We'll get back to you soon.`}</span>
          <Link
            to="/author/tickets"
            className="w-fit font-bold text-ink-blue underline decoration-wavy underline-offset-4"
          >
            View my ticket
          </Link>
        </span>,
        { type: 'success', duration: 7000 },
      );
      navigate('/author/tickets');
    } catch (err) {
      toast(apiError(err), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(event) {
    setFiles(Array.from(event.target.files ?? []).slice(0, 5));
  }

  function handleDrop(event) {
    event.preventDefault();
    setFiles(Array.from(event.dataTransfer.files ?? []).slice(0, 5));
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <SectionTag>We’re here to help</SectionTag>
        <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-pencil md:text-5xl">Submit a Query</h1>
        <p className="mx-auto mt-2 max-w-2xl text-lg leading-relaxed text-pencil/75">
          Our support team typically responds within 1–2 business days.
        </p>
      </header>

      <Card decoration="tape" className="mx-auto w-full max-w-3xl p-5 pt-8 sm:p-8 sm:pt-10">
        <form onSubmit={handleSubmit} id="submit-query-form" className="space-y-6">
          <Select
            id="book-select"
            label="Book (optional)"
            value={bookId}
            onChange={(event) => setBookId(event.target.value)}
          >
            <option value="">General / Account Level</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title} [{book.bookId}]
              </option>
            ))}
          </Select>

          <div className="space-y-2">
            <Input
              id="subject"
              label="Subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Brief description of your issue"
              maxLength={MAX_SUBJECT}
              error={errors.subject}
            />
            <p className="text-right text-base text-pencil/70">
              {subject.length}/{MAX_SUBJECT}
            </p>
          </div>

          <div className="space-y-2">
            <Textarea
              id="description"
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your issue in detail. Include any relevant dates, amounts, or platform names."
              rows={8}
              maxLength={MAX_DESC}
              helperText={`Minimum 10 characters; maximum ${MAX_DESC.toLocaleString('en-IN')} characters.`}
              error={errors.description}
            />
            <p className="text-right text-base text-pencil/70">
              {description.length}/{MAX_DESC.toLocaleString('en-IN')}
            </p>
          </div>

          <section aria-labelledby="attachments-label" className="space-y-2">
            <h2 id="attachments-label" className="font-body text-lg font-bold text-pencil">
              Attachments <span className="font-normal text-pencil/70">(optional)</span>
            </h2>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center gap-3 border-2 border-dashed border-ink-blue bg-white/70 p-5 text-center"
              style={{ borderRadius: wobblyAlt }}
            >
              <UploadCloud aria-hidden="true" className="h-8 w-8 text-ink-blue" strokeWidth={2.5} />
              <p className="text-lg leading-relaxed text-pencil">
                Drop files here or choose files (up to 5).
              </p>
              <input
                ref={fileRef}
                id="file-input"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFiles}
                className="sr-only"
                aria-label="Choose attachments"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileRef.current?.click()}
                className="bg-white"
              >
                <Paperclip aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                Choose files
              </Button>
              <p className="text-base leading-relaxed text-pencil/70">
                Attachment names are recorded for reference; file upload is UI-only.
              </p>
            </div>
            {files.length > 0 && (
              <ul aria-label="Chosen files" className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center gap-2 border-2 border-dashed border-muted bg-white px-3 py-2 text-lg text-pencil"
                    style={{ borderRadius: wobbly }}
                  >
                    <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-blue" strokeWidth={2.5} />
                    <span className="break-all">{file.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap gap-3 border-t-2 border-dashed border-muted pt-5">
            <Button type="submit" loading={loading} disabled={loading}>
              <Send aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
              Submit Query
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/author/tickets')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
