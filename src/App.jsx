import { HashRouter, Routes, Route } from 'react-router-dom';
import { LangProvider, ThemeProvider } from './utils/data';
import Navbar from './components/Navbar';
import CmdKSearch from './components/CmdKSearch';
import ErrorBoundary from './components/ErrorBoundary';
import { lazy, Suspense } from 'react';
import Loading from './components/Loading';

const HomePage = lazy(() => import('./pages/HomePage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const ScholarDetail = lazy(() => import('./pages/ScholarDetail'));
const MapPage = lazy(() => import('./pages/MapPage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const BooksPage = lazy(() => import('./pages/BooksPage'));
const MadrasasPage = lazy(() => import('./pages/MadrasasPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CityPage = lazy(() => import('./pages/CityPage'));
const DynastyPage = lazy(() => import('./pages/DynastyPage'));
const DynastiesPage = lazy(() => import('./pages/DynastiesPage'));
const BookDetailPage = lazy(() => import('./pages/BookDetailPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <HashRouter>
          <div className="min-h-screen bg-sand-50 dark:bg-ink-950 bg-pattern-geo transition-colors duration-300">
            <a href="#main-content" className="skip-to-content">Skip to content</a>
            <Navbar />
            <CmdKSearch />
            <ErrorBoundary>
              <main id="main-content">
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/scholar/:id" element={<ScholarDetail />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/network" element={<NetworkPage />} />
                  <Route path="/timeline" element={<TimelinePage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/books" element={<BooksPage />} />
                  <Route path="/madrasas" element={<MadrasasPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/city/:name" element={<CityPage />} />
                  <Route path="/dynasty/:id" element={<DynastyPage />} />
                  <Route path="/dynasties" element={<DynastiesPage />} />
                  <Route path="/book/:uri" element={<BookDetailPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              </main>
            </ErrorBoundary>
          </div>
        </HashRouter>
      </LangProvider>
    </ThemeProvider>
  );
}
