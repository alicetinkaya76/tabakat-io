import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getBooks, getSearchIndex, useLang } from '../utils/data';
import { getLabel, getFieldLabel, FIELD_LABELS } from '../utils/i18n';
import { formatNumber, parseName } from '../utils/helpers';
import ScholarCard from '../components/ScholarCard';
import { ScrollReveal } from '../hooks/useInView';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

export default function BookDetailPage() {
  const { uri } = useParams();
  const decodedUri = decodeURIComponent(uri);
  const { lang } = useLang();
  const [book, setBook] = useState(null);
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('importance');

  useEffect(() => {
    setLoading(true);
    Promise.all([getBooks(), getSearchIndex()]).then(([books, searchIdx]) => {
      const found = books.find(b => b.openiti_uri === decodedUri);
      setBook(found || null);

      if (found && searchIdx?.data) {
        // Match scholars who have this book in their book_list
        // We need to load scholar detail data for book_list matching
        // For now, match by author name in search index
        const authorWords = (found.author_tr || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const matched = searchIdx.data.filter(s => {
          if (!s.n) return false;
          const name = s.n.toLowerCase();
          return authorWords.some(w => name.includes(w));
        }).slice(0, 200);

        const impOrder = { high: 0, medium: 1, low: 2 };
        matched.sort((a, b) => {
          const ia = impOrder[a.i] ?? 1, ib = impOrder[b.i] ?? 1;
          return ia !== ib ? ia - ib : (b.s || 0) - (a.s || 0);
        });
        setScholars(matched);
      }
      setLoading(false);
    });
  }, [decodedUri]);

  const sorted = useMemo(() => {
    let items = [...scholars];
    if (sortBy === 'death') items.sort((a, b) => (a.d || 9999) - (b.d || 9999));
    else if (sortBy === 'name') items.sort((a, b) => (a.n || '').localeCompare(b.n || ''));
    else {
      const impOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => {
        const ia = impOrder[a.i] ?? 1, ib = impOrder[b.i] ?? 1;
        return ia !== ib ? ia - ib : (b.s || 0) - (a.s || 0);
      });
    }
    return items;
  }, [scholars, sortBy]);

  const fieldDist = useMemo(() => {
    const counts = {};
    for (const s of scholars) {
      if (s.fn) counts[s.fn] = (counts[s.fn] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [scholars]);

  const mapToScholar = (item) => {
    const names = parseName(item.n);
    return {
      id: item.id, name_tr: names.name_tr, name_en: names.name_en, name_ar: names.name_ar,
      death_ce: item.d, field_normalized: item.fn, era_normalized: item.en,
      madhab_normalized: item.mn, importance: item.i, source_count: item.s, region: item.r,
    };
  };

  if (loading) return <Loading />;

  if (!book) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center fade-in">
      <div className="drift-float inline-block mb-6"><span className="text-6xl">📚</span></div>
      <h2 className="font-display text-2xl font-semibold text-ink-700 dark:text-sand-200 mb-2">
        {lang === 'tr' ? 'Kitap bulunamadı' : 'Book not found'}
      </h2>
      <p className="text-sm text-ink-400 dark:text-sand-500 font-mono mb-6">{decodedUri}</p>
      <Link to="/books" className="btn-primary text-sm">← {getLabel('books', lang)}</Link>
    </div>
  );

  const bioCount = book.bio_count ? parseInt(book.bio_count).toLocaleString('tr-TR') : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <SEO
        title={book.title_tr}
        path={`/book/${encodeURIComponent(decodedUri)}`}
        description={`${book.title_tr} — ${book.author_tr}`}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-ink-400 dark:text-sand-500 mb-6 fade-in">
        <Link to="/books" className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors">{getLabel('books', lang)}</Link>
        <span className="mx-2">›</span>
        <span className="text-ink-700 dark:text-sand-200 truncate">{book.title_tr}</span>
      </nav>

      {/* Hero */}
      <div className="card book-hero p-6 sm:p-8 mb-8 fade-in-scale">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center text-3xl shrink-0">📖</div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-sand-50 leading-tight mb-1">
              {book.title_tr}
            </h1>
            {book.title_ar && (
              <p className="ar-text text-lg text-ink-500 dark:text-sand-400 mb-2">{book.title_ar}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600 dark:text-sand-400 mb-4">
          <span className="font-medium text-ink-800 dark:text-sand-200">{book.author_tr}</span>
          {book.author_ar && <span className="ar-text text-ink-500 dark:text-sand-400">({book.author_ar})</span>}
          {book.death_hijri && <span className="font-mono text-[13px] bg-sand-100/60 dark:bg-ink-800/60 px-2 py-0.5 rounded-lg">d. {book.death_hijri} H</span>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {book.genre && <span className="badge bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-400">{book.genre}</span>}
          {bioCount && <span className="badge bg-sand-100 text-sand-700 dark:bg-ink-800 dark:text-sand-400">{bioCount} {lang === 'tr' ? 'biyografi' : 'biographies'}</span>}
          {book.size_mb && <span className="badge bg-sand-100 text-sand-700 dark:bg-ink-800 dark:text-sand-400">{book.size_mb} MB</span>}
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {bioCount && (
            <span className="text-ink-500 dark:text-sand-400">
              <strong className="text-ink-800 dark:text-sand-200 font-display text-base">{bioCount}</strong>
              <span className="ml-1 text-xs">{lang === 'tr' ? 'biyografi' : 'biographies'}</span>
            </span>
          )}
          {scholars.length > 0 && (
            <span className="text-ink-500 dark:text-sand-400">
              <strong className="text-ink-800 dark:text-sand-200 font-display text-base">{formatNumber(scholars.length)}</strong>
              <span className="ml-1 text-xs">{lang === 'tr' ? 'eşleşen âlim' : 'matched scholars'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      {fieldDist.length > 0 && (
        <ScrollReveal>
          <div className="card p-5 mb-8">
            <h3 className="text-xs font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">
              {lang === 'tr' ? 'Alan Dağılımı' : 'Field Distribution'}
            </h3>
            <div className="flex flex-wrap gap-3">
              {fieldDist.map(([field, count]) => (
                <span key={field} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FIELD_LABELS[field]?.color || '#a4b0bb' }} />
                  <span className="text-ink-600 dark:text-sand-300">{getFieldLabel(field, lang)}</span>
                  <span className="font-mono text-ink-400 dark:text-sand-500">({count})</span>
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Scholar list */}
      {scholars.length > 0 && (
        <ScrollReveal delay={100}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-ink-800 dark:text-sand-100">
              {getLabel('book_scholars', lang)}
            </h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-sand-300 dark:border-ink-600 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-gold-300"
            >
              <option value="importance">{lang === 'tr' ? 'Önem' : 'Importance'}</option>
              <option value="death">{lang === 'tr' ? 'Vefat' : 'Death date'}</option>
              <option value="name">{lang === 'tr' ? 'İsim' : 'Name'}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.slice(0, 60).map(item => (
              <ScholarCard key={item.id} scholar={mapToScholar(item)} />
            ))}
          </div>
          {sorted.length > 60 && (
            <p className="text-center text-sm text-ink-400 dark:text-sand-500 mt-6">
              {lang === 'tr' ? `İlk 60 gösterildi (toplam ${sorted.length})` : `Showing first 60 of ${sorted.length}`}
            </p>
          )}
        </ScrollReveal>
      )}
    </div>
  );
}
