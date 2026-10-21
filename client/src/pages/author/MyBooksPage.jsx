import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  Coins,
  RotateCw,
  ShoppingBag,
} from "lucide-react";
import { booksApi } from "../../api/endpoints.js";
import { apiError } from "../../utils/constants.js";
import { StatusBadge } from "../../components/Badges.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { SectionTag } from "../../components/ui/SectionTag.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { wobbly, wobblyAlt, wobblySoft } from "../../theme/wobbly.js";

const stageNames = [
  { label: "Manuscript", match: "manuscript" },
  { label: "Editing", match: "editing" },
  { label: "Cover Design", match: "cover" },
  { label: "Typesetting", match: "typeset" },
  { label: "Proofreading", match: "proof" },
  { label: "ISBN", match: "isbn" },
  { label: "Printing", match: "print" },
  { label: "Distribution", match: "distribution" },
  { label: "Live", match: "live" },
];

const cardRadii = [wobbly, wobblyAlt, wobblySoft];
const cardTilts = [-1, 0, 1];

function formatMoney(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStageIndex(status) {
  const stage = String(status)
    .replace(/^In Production\s*-\s*/i, "")
    .toLowerCase();
  return stageNames.findIndex(({ match }) => stage.includes(match));
}

function ProductionProgress({ status }) {
  const currentIndex = getStageIndex(status);

  return (
    <section
      aria-label={`Production progress: ${status}`}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <SectionTag>Production stages</SectionTag>
        <span className="text-lg text-pencil/70">{status}</span>
      </div>
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {stageNames.map(({ label }, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = currentIndex >= 0 && index < currentIndex;
          return (
            <li
              key={label}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex min-h-12 items-center gap-2 border-2 px-2 py-1.5 text-lg leading-tight ${
                isCurrent
                  ? "border-accent bg-white font-bold text-pencil"
                  : isComplete
                    ? "border-ink-blue/50 bg-white text-pencil"
                    : "border-dashed border-muted bg-white/70 text-pencil/70"
              }`}
              style={{ borderRadius: wobblySoft }}
            >
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center border-2 ${
                  isCurrent
                    ? "border-accent bg-postit"
                    : isComplete
                      ? "border-ink-blue text-ink-blue"
                      : "border-muted"
                }`}
                style={{ borderRadius: wobbly }}
              >
                {isComplete ? (
                  <CircleCheck className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <span className="text-lg">{index + 1}</span>
                )}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function BookMetric({ icon: Icon, label, value }) {
  return (
    <div
      className="min-w-0 border-2 border-dashed border-muted bg-white/80 p-3"
      style={{ borderRadius: wobblySoft }}
    >
      <div className="flex items-center gap-2 text-lg font-bold text-pencil/70">
        <Icon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-ink-blue"
          strokeWidth={2.5}
        />
        <span>{label}</span>
      </div>
      <p className="mt-1 break-words text-lg leading-relaxed text-pencil">
        {value}
      </p>
    </div>
  );
}

function RoyaltyMetric({ label, value, pending = false }) {
  return (
    <div
      className={`min-w-0 border-2 border-pencil p-3 ${pending ? "bg-postit" : "bg-white"}`}
      style={{ borderRadius: wobblySoft }}
    >
      <p className="text-lg font-bold text-pencil/70">{label}</p>
      <p className="mt-1 break-words font-heading text-2xl font-bold text-pencil">
        {value}
      </p>
    </div>
  );
}

function BookCard({ book, index }) {
  const inProduction = String(book.status).startsWith("In Production");
  const royalty = book.royalty ?? {};
  const sales = Number(book.totalCopiesSold ?? 0);
  const decoration = index % 2 === 0 ? "tape" : "tack";
  const radius = cardRadii[index % cardRadii.length];
  const tilt = cardTilts[index % cardTilts.length];

  return (
    <Card
      decoration={decoration}
      tilt={tilt}
      className="flex min-w-0 flex-col gap-5 p-5 sm:p-6"
      style={{ borderRadius: radius }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center border-2 border-dashed border-ink-blue bg-white text-ink-blue"
              style={{ borderRadius: wobbly }}
            >
              <BookOpen className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h2 className="break-words font-heading text-3xl font-bold leading-tight text-pencil">
                {book.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SectionTag>{book.genre || "Genre not set"}</SectionTag>
                <span className="text-lg text-pencil/70">
                  ISBN: {book.isbn || "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <StatusBadge status={book.status} />
      </div>

      {inProduction && <ProductionProgress status={book.status} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <BookMetric
          icon={CalendarDays}
          label="Publication date"
          value={formatDate(book.publicationDate) ?? "Not published yet"}
        />
        <BookMetric
          icon={CircleDollarSign}
          label="MRP"
          value={formatMoney(book.mrp) ?? "Pricing set at publication"}
        />
        <BookMetric
          icon={ShoppingBag}
          label="Copies sold"
          value={sales === 0 ? "No sales yet" : sales.toLocaleString("en-IN")}
        />
      </div>

      {inProduction ? (
        <p
          className="border-2 border-dashed border-ink-blue bg-white px-4 py-3 text-lg font-bold leading-relaxed text-pencil"
          style={{ borderRadius: wobblySoft }}
        >
          Royalties start after publication.
        </p>
      ) : (
        <section
          aria-label={`Royalty summary for ${book.title}`}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Coins
              aria-hidden="true"
              className="h-5 w-5 text-ink-blue"
              strokeWidth={2.5}
            />
            <h3 className="font-heading text-2xl font-bold text-pencil">
              Royalty summary
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <RoyaltyMetric
              label="Earned"
              value={formatMoney(book.totalRoyaltyEarned) ?? "₹0"}
            />
            <RoyaltyMetric
              label="Paid"
              value={formatMoney(book.royaltyPaid) ?? "₹0"}
            />
            <RoyaltyMetric
              label="Pending"
              value={formatMoney(book.royaltyPending) ?? "₹0"}
              pending
            />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-lg leading-relaxed text-pencil/75">
            <span>
              Last payout:{" "}
              {formatDate(book.lastRoyaltyPayoutDate) ?? "No payout yet"}
            </span>
            {royalty.belowThreshold && (
              <span>
                Pending below ₹1,000 threshold; rolls over next quarter.
              </span>
            )}
            {royalty.neverPaid && !royalty.belowThreshold && (
              <span>
                First payout pending; please verify your bank details.
              </span>
            )}
            {royalty.nextPayoutDate && (
              <span>
                Next payout:{" "}
                {formatDate(royalty.nextPayoutDate) ?? royalty.nextPayoutDate}
              </span>
            )}
          </div>
        </section>
      )}

      {book.availableOn?.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Available on">
          {book.availableOn.map((platform) => (
            <SectionTag key={platform}>{platform}</SectionTag>
          ))}
        </div>
      )}

      {book.printPartner && (
        <p className="text-lg leading-relaxed text-pencil/70">
          Print partner: {book.printPartner}
        </p>
      )}
    </Card>
  );
}

function BookCardSkeleton() {
  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton circle />
        <Skeleton lines={2} />
      </div>
      <Skeleton lines={3} />
      <Skeleton lines={2} />
    </Card>
  );
}

export default function MyBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBooks = useCallback(async () => {
    const { data } = await booksApi.list();
    return data.data ?? [];
  }, []);

  function retryBooks() {
    setLoading(true);
    setError("");
    fetchBooks()
      .then(setBooks)
      .catch((err) => setError(apiError(err) || "Failed to load books."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    fetchBooks()
      .then((data) => {
        if (!active) return;
        setBooks(data);
        setError("");
      })
      .catch((err) => {
        if (active) setError(apiError(err) || "Failed to load books.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchBooks]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTag>Author shelf</SectionTag>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-pencil md:text-5xl">
            My Books
          </h1>
          {!loading && !error && (
            <p className="mt-2 text-lg leading-relaxed text-pencil/75">
              {books.length} book{books.length !== 1 ? "s" : ""} in your
              portfolio
            </p>
          )}
        </div>
      </header>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="grid gap-6 md:grid-cols-2"
          aria-label="Loading books"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <BookCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <Card
          className="flex flex-col items-start gap-4 border-accent p-6"
          role="alert"
        >
          <div className="flex items-center gap-3 text-[#b91c1c]">
            <CircleHelp
              aria-hidden="true"
              className="h-7 w-7"
              strokeWidth={2.5}
            />
            <h2 className="font-heading text-2xl font-bold">
              We couldn’t load your books
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-pencil">{error}</p>
          <Button onClick={retryBooks}>
            <RotateCw
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.5}
            />
            Try again
          </Button>
        </Card>
      ) : books.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            heading="Your shelf is waiting"
            description="Your published and in-production books will appear here."
          />
        </Card>
      ) : (
        <div className="grid min-w-0 gap-6 md:grid-cols-2">
          {books.map((book, index) => (
            <BookCard key={book._id} book={book} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
