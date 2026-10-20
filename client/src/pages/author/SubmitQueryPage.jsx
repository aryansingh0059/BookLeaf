import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksApi, ticketsApi } from '../../api/endpoints.js';
import { apiError } from '../../utils/constants.js';
import toast from 'react-hot-toast';

const MAX_SUBJECT = 150;
const MAX_DESC = 5000;

export default function SubmitQueryPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    booksApi.list().then(({ data }) => setBooks(data.data ?? []));
  }, []);

  function validate() {
    const e = {};
    if (subject.trim().length < 3) e.subject = 'Subject must be at least 3 characters';
    if (subject.trim().length > MAX_SUBJECT) e.subject = `Subject must be at most ${MAX_SUBJECT} characters`;
    if (description.trim().length < 10) e.description = 'Description must be at least 10 characters';
    if (description.trim().length > MAX_DESC) e.description = `Description must be at most ${MAX_DESC} characters`;
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const attachments = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
      const { data } = await ticketsApi.create({
        bookId: bookId || null,
        subject: subject.trim(),
        description: description.trim(),
        attachments,
      });
      const ticketNum = data.data?.ticketNumber ?? '';
      toast.success(`Ticket ${ticketNum} submitted! We'll get back to you soon.`);
      navigate('/author/tickets');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(e) {
    const picked = Array.from(e.target.files ?? []).slice(0, 5);
    setFiles(picked);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit a Query</h1>
          <p className="page-subtitle">Our support team typically responds within 1-2 business days</p>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit} id="submit-query-form">
          <div className="card">
            <div className="form-group">
              <label htmlFor="book-select" className="form-label">Book (optional)</label>
              <select
                id="book-select"
                className="form-select"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
              >
                <option value="">General / Account Level</option>
                {books.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} [{b.bookId}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">Subject <span>*</span></label>
              <input
                id="subject"
                type="text"
                className={`form-input ${errors.subject ? 'error' : ''}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                maxLength={MAX_SUBJECT}
              />
              {errors.subject && <div className="form-error">{errors.subject}</div>}
              <div className="char-count">{subject.length}/{MAX_SUBJECT}</div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description <span>*</span></label>
              <textarea
                id="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail. Include any relevant dates, amounts, or platform names."
                rows={8}
                maxLength={MAX_DESC}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
              <div className="char-count">{description.length}/{MAX_DESC}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Attachments (optional)</label>
              <input
                ref={fileRef}
                type="file"
                id="file-input"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFiles}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                📎 Choose files (up to 5)
              </button>
              {files.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {files.map((f) => (
                    <span key={f.name} className="tag">📄 {f.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" id="submit-btn" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner"></span> Submitting…</> : 'Submit Query'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/author/tickets')}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
