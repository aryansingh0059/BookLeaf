import { useState, useEffect } from "react";
import { booksApi } from "../../api/endpoints.js";
import { PRODUCTION_STAGES } from "../../utils/constants.js";
import { StatusBadge } from "../../components/Badges.jsx";

const fmt = (n) => (n == null ? null : `₹${Number(n).toLocaleString('en-IN')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : null);

function getStageIndex(status) {
  if (!status || !status.startsWith('In Production')) return -1;
  const stagePart = status.replace('In Production - ', '').toLowerCase();
  return PRODUCTION_STAGES.findIndex((s) => s.toLowerCase().includes(stagePart));
}

function ProductionProgress({ status }) {
  const idx = getStageIndex(status);
  const stages = PRODUCTION_STAGES.slice(0, -1); // exclude 'Published & Live'
  return (
    <div>
      <div className="production-stages">
        {stages.map((stage, i) => (
          <div
            key={stage}
            className={`stage-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`}
            title={stage}
          />
        ))}
      </div>
      <div className="stage-label" style={{ marginTop: '4px' }}>{status}</div>
    </div>
  );
}

function BookCard({ book }) {
  const inProd = book.status.startsWith('In Production');
  const royalty = book.royalty ?? {};

  return (
    <div className="book-card">
      <div>
        <div className="book-title">{book.title}</div>
        <div className="book-meta" style={{ marginTop: '4px' }}>
          <span>📖 {book.genre}</span>
          <span>ISBN: {book.isbn}</span>
        </div>
      </div>

      {inProd ? (
        <ProductionProgress status={book.status} />
      ) : (
        <StatusBadge status={book.status} />
      )}

      <div className="book-stats">
        <div className="book-stat">
          <span className="book-stat-label">Published</span>
          <span className="book-stat-value">{fmtDate(book.publicationDate) ?? 'Not yet published'}</span>
        </div>
        <div className="book-stat">
          <span className="book-stat-label">MRP</span>
          <span className="book-stat-value">{fmt(book.mrp) ?? 'TBD'}</span>
        </div>
        <div className="book-stat">
          <span className="book-stat-label">Copies Sold</span>
          <span className="book-stat-value">{inProd ? '—' : book.totalCopiesSold}</span>
        </div>
        <div className="book-stat">
          <span className="book-stat-label">Royalty Earned</span>
          <span className="book-stat-value">{inProd ? '—' : (fmt(book.totalRoyaltyEarned) ?? '₹0')}</span>
        </div>
        <div className="book-stat">
          <span className="book-stat-label">Royalty Paid</span>
          <span className="book-stat-value">{inProd ? '—' : (fmt(book.royaltyPaid) ?? '₹0')}</span>
        </div>
        <div className="book-stat">
          <span className="book-stat-label">Royalty Pending</span>
          <span className="book-stat-value" style={{ color: book.royaltyPending > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {inProd ? '—' : (fmt(book.royaltyPending) ?? '₹0')}
          </span>
        </div>
      </div>

      {!inProd && (
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>
          {royalty.belowThreshold && <div style={{ color: 'var(--color-warning)' }}>⚠ Pending below ₹1,000 threshold — rolls over next quarter</div>}
          {royalty.neverPaid && !royalty.belowThreshold && <div style={{ color: 'var(--color-warning)' }}>⏳ First payout pending — verify bank details</div>}
          <div>Last payout: {fmtDate(book.lastRoyaltyPayoutDate) ?? 'No payout yet'}</div>
          <div>Next payout: ~{royalty.nextPayoutDate}</div>
        </div>
      )}

      {book.availableOn?.length > 0 && (
        <div className="book-platforms">
          {book.availableOn.map((p) => (
            <span key={p} className="platform-tag">{p}</span>
          ))}
        </div>
      )}

      {book.printPartner && (
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>
          Print partner: {book.printPartner}
        </div>
      )}
    </div>
  );
}

export default function MyBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    booksApi.list()
      .then(({ data }) => setBooks(data.data ?? []))
      .catch(() => setError('Failed to load books.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><span className="spinner"></span> Loading your books…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Books</h1>
          <p className="page-subtitle">{books.length} book{books.length !== 1 ? 's' : ''} in your portfolio</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No books yet</h3>
          <p>Your published and in-production books will appear here.</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => <BookCard key={book._id} book={book} />)}
        </div>
      )}
    </div>
  );
}
