import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAsync, getBooks, useLang } from '../utils/data';
import { getLabel } from '../utils/i18n';
import { formatNumber, debounce } from '../utils/helpers';
import Loading from '../components/Loading';

const GENRE_COLORS = {
  "Tabakât (Biyografi)": '#07c4a3',
  "Terâcim (Biyografi)": '#039e87',
  "Hadis": '#dc9a24',
  "Hadis/Ricâl": '#c37a1b',
  "Ricâl (Hadis Değerlendirme)": '#a25a19',
  "Tehzîb (Ricâl Özeti)": '#85481c',
  "Mîzân (Cerh-Ta'dîl)": '#6e3c1a',
  "Siyer/Vefeyât": '#5c6d7d',
  "Târîh (Tarih)": '#444e59',
  "Sahâbe Biyografisi": '#e5b63f',
  "Ensâb (Soy/Nisbe/Kabile)": '#8d6843',
  "Fıkıh": '#087e6d',
  "Tefsir": '#0c6458',
  "Bibliyografya": '#778897',
  "Lügat (Sözlük)": '#3c434c',
  "Mu'cem (Sözlük/Katalog)": '#73553c',
  "Diğer": '#a4b0bb',
};

export default function BooksPage() {
  const { lang } = useLang();
  const { data: books, loading } = useAsync(getBooks);
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('bio_count');

  const genres = useMemo(() => {
    if (!books) return [];
    const counts = {};
    for (const b of books) {
      const g = b.genre || 'Diğer';
      counts[g] = (counts[g] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const filtered = useMemo(() => {
    if (!books) return [];
    let items = [...books];

    if (query) {
      const q = query.toLowerCase();
      items = items.filter(b =>
        (b.title_tr || '').toLowerCase().includes(q) ||
        (b.title_ar || '').toLowerCase().includes(q) ||
        (b.author_tr || '').toLowerCase().includes(q) ||
        (b.author_ar || '').toLowerCase().includes(q)
      );
    }

    if (selectedGenre !== 'all') {
      items = items.filter(b => b.genre === selectedGenre);
    }

    if (sortBy === 'bio_count') {
      items.sort((a, b) => (parseInt(b.bio_count) || 0) - (parseInt(a.bio_count) || 0));
    } else if (sortBy === 'size') {
      items.sort((a, b) => (parseFloat(b.size_mb) || 0) - (parseFloat(a.size_mb) || 0));
    } else if (sortBy === 'death') {
      items.sort((a, b) => (parseInt(a.death_hijri) || 9999) - (parseInt(b.death_hijri) || 9999));
    } else if (sortBy === 'title') {
      items.sort((a, b) => (a.title_tr || '').localeCompare(b.title_tr || '', 'tr'));
    }

    return items;
  }, [books, query, selectedGenre, sortBy]);

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">{getLabel('books', lang)}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {formatNumber(filtered.length)} / {formatNumber(books?.length || 0)} {lang === 'tr' ? 'tabakat kitabı' : 'tabaqāt books'}
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-sand-300 rounded-lg px-3 py-1.5 bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-ink-800 dark:border-ink-600 dark:text-sand-200"
        >
          <option value="bio_count">{lang === 'tr' ? 'Biyografi Sayısı' : 'Biography Count'}</option>
          <option value="size">{lang === 'tr' ? 'Boyut' : 'Size'}</option>
          <option value="death">{lang === 'tr' ? 'Müellif Vefatı' : 'Author Death'}</option>
          <option value="title">{lang === 'tr' ? 'Başlık' : 'Title'}</option>
        </select>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === 'tr' ? 'Kitap veya müellif ara...' : 'Search book or author...'}
          className="input-search"
        />
      </div>

      {/* Genre filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setSelectedGenre('all')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
            selectedGenre === 'all'
              ? 'border-transparent bg-ink-900 text-white dark:bg-gold-600'
              : 'border-sand-200 text-ink-600 hover:border-sand-400 bg-white/60 dark:border-ink-600 dark:text-sand-300 dark:bg-ink-800'
          }`}
        >
          {getLabel('all', lang)}
          <span className={`text-[10px] ${selectedGenre === 'all' ? 'opacity-75' : 'text-ink-400'}`}>
            {books?.length || 0}
          </span>
        </button>
        {genres.map(([genre, count]) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre === selectedGenre ? 'all' : genre)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
              selectedGenre === genre
                ? 'border-transparent text-white shadow-sm'
                : 'border-sand-200 text-ink-600 hover:border-sand-400 bg-white/60 dark:border-ink-600 dark:text-sand-300 dark:bg-ink-800'
            }`}
            style={selectedGenre === genre ? { backgroundColor: GENRE_COLORS[genre] || '#a4b0bb' } : undefined}
          >
            {genre}
            <span className={`text-[10px] ${selectedGenre === genre ? 'opacity-75' : 'text-ink-400'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">📚</p>
          <p className="text-ink-500">{getLabel('no_results', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((book) => (
            <BookCard key={book.idx} book={book} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookCard({ book, lang }) {
  const genreColor = GENRE_COLORS[book.genre] || '#a4b0bb';
  const bios = parseInt(book.bio_count) || 0;
  const size = parseFloat(book.size_mb) || 0;
  const bookUrl = book.openiti_uri ? `/book/${encodeURIComponent(book.openiti_uri)}` : null;

  const Wrapper = bookUrl ? Link : 'div';
  const wrapperProps = bookUrl ? { to: bookUrl } : {};

  return (
    <Wrapper {...wrapperProps} className="card-hover block p-5 group">
      {/* Title */}
      <div className="mb-3">
        <h3 className="font-display text-base font-semibold text-ink-900 leading-tight group-hover:text-gold-700 transition-colors dark:text-sand-100">
          {book.title_tr}
        </h3>
        {book.title_ar && (
          <p className="ar-text text-sm text-ink-500 mt-1 truncate dark:text-sand-400">{book.title_ar}</p>
        )}
      </div>

      {/* Author */}
      <p className="text-sm text-ink-600 mb-2 dark:text-sand-300">
        {book.author_tr}
        {book.death_hijri && (
          <span className="text-ink-400 font-mono text-xs ml-1 dark:text-sand-500">(d. {book.death_hijri} H)</span>
        )}
      </p>
      {book.author_ar && (
        <p className="ar-text text-xs text-ink-400 mb-3 truncate dark:text-sand-500">{book.author_ar}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-ink-500 mb-3 dark:text-sand-400">
        {bios > 0 && (
          <span>
            <strong className="text-ink-700 dark:text-sand-200">{bios.toLocaleString('tr-TR')}</strong> {lang === 'tr' ? 'biyografi' : 'biographies'}
          </span>
        )}
        {size > 0 && (
          <span className="text-ink-400 dark:text-sand-500">{size.toFixed(1)} MB</span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {book.genre && (
          <span
            className="badge text-[10px]"
            style={{ backgroundColor: genreColor + '18', color: genreColor }}
          >
            {book.genre}
          </span>
        )}
        {book.openiti_uri && (
          <span className="badge text-[10px] bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
            OpenITI
          </span>
        )}
      </div>
    </Wrapper>
  );
}
