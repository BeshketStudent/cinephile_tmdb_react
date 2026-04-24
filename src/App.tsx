import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from './types';
import { movieService } from './services/movieService';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieCard from './components/MovieCard';
import CustomDropdown from './components/ui/CustomDropdown';
import { Film, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { HeroSkeleton, MovieListSkeleton } from './components/Skeletons';

const MovieDetails = lazy(() => import('./components/MovieDetails'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));

const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const AdvancedSearch = lazy(() => import('./components/AdvancedSearch'));

type ViewState = 'home' | 'watchlist' | 'profile' | 'search' | 'privacy' | 'terms';

export default function App() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [popularGenre, setPopularGenre] = useState<number | null>(null);
  const [topRatedGenre, setTopRatedGenre] = useState<number | null>(null);
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingTopRated, setLoadingTopRated] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ... initData ...
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [trendingData, genreData] = await Promise.all([
          movieService.getTrending(),
          movieService.getGenres(),
        ]);
        setTrending(trendingData.results);
        setGenres(genreData.genres);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Prevent dual scrollbars when modals are open
  useEffect(() => {
    if (selectedMovie || showLogin) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedMovie, showLogin]);

  useEffect(() => {
    async function updatePopular() {
      try {
        setLoadingPopular(true);
        window.scrollBy({ left: 0 }); // prevent horizontal jump visually sometimes
        let data;
        if (popularGenre === null) {
          data = await movieService.getPopular(popularPage);
        } else {
          data = await movieService.discoverMovies({ 
            with_genres: popularGenre.toString(),
            sort_by: 'popularity.desc',
            page: popularPage.toString()
          });
        }
        
        if (popularPage === 1) {
            setPopular(data.results);
        } else {
            setPopular(prev => {
                // Filter out duplicates (TMDB API sometimes returns duplicates across pages)
                const existingIds = prev.map(m => m.id);
                const newMovies = data.results.filter((m: Movie) => !existingIds.includes(m.id));
                return [...prev, ...newMovies];
            });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPopular(false);
      }
    }
    updatePopular();
  }, [popularGenre, popularPage]);

  // Reset page when genre changes
  useEffect(() => { setPopularPage(1); }, [popularGenre]);

  useEffect(() => {
    async function updateTopRated() {
      try {
        setLoadingTopRated(true);
        let data;
        if (topRatedGenre === null) {
          data = await movieService.getTopRated(topRatedPage);
        } else {
          data = await movieService.discoverMovies({ 
            with_genres: topRatedGenre.toString(),
            sort_by: 'vote_average.desc',
            'vote_count.gte': '500', // Ensure quality
            page: topRatedPage.toString()
          });
        }
        
        if (topRatedPage === 1) {
            setTopRated(data.results);
        } else {
            setTopRated(prev => {
                const existingIds = prev.map(m => m.id);
                const newMovies = data.results.filter((m: Movie) => !existingIds.includes(m.id));
                return [...prev, ...newMovies];
            });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTopRated(false);
      }
    }
    updateTopRated();
  }, [topRatedGenre, topRatedPage]);
  
  // Reset page when genre changes
  useEffect(() => { setTopRatedPage(1); }, [topRatedGenre]);

  // Listen to watchlist updates
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'watchlist'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Movie[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Movie);
      });
      setWatchlist(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Using a ref to store the timeout to prevent excessive API calls
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((queryStr: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (!queryStr.trim()) {
      setSearchResults(null);
      return;
    }
    
    const newTimeout = setTimeout(async () => {
      try {
        const data = await movieService.searchMovies(queryStr);
        setSearchResults(data.results);
      } catch (err) {
        console.error(err);
      }
    }, 400); // 400ms debounce
    
    setSearchTimeout(newTimeout);
  }, [searchTimeout]);

  if (error) {
    // ... (Keep existing error screen)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-6 leading-relaxed">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] mesh-indigo pointer-events-none z-0" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] mesh-rose pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 border border-indigo-500/20 glass">
            <AlertCircle className="w-10 h-10 text-indigo-400" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4 font-display tracking-tight text-white/90">API Key Required</h2>
          <p className="text-white/40 text-center mb-10 text-base">
            To explore the cinematic library, you need to provide a TMDB API Access Token.
          </p>

          <div className="w-full p-8 glass rounded-3xl border-white/10 shadow-2xl">
            <p className="font-bold text-indigo-400 mb-6 uppercase tracking-[0.2em] text-[10px]">Setup Guide</p>
            <ol className="space-y-6 text-sm">
              <li className="flex gap-4">
                <span className="flex-none w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">1</span>
                <p className="text-white/60">Go to <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">TMDB API Settings</a> and get your API Key.</p>
              </li>
              <li className="flex gap-4">
                <span className="flex-none w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">2</span>
                <p className="text-white/60">Open the <b>Secrets</b> panel (gear icon) in the AI Studio sidebar.</p>
              </li>
              <li className="flex gap-4">
                <span className="flex-none w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">3</span>
                <p className="text-white/60">Add a secret with name <code className="px-2 py-1 bg-white/5 rounded text-indigo-400 font-mono text-xs">VITE_TMDB_API_KEY</code> and paste your key.</p>
              </li>
            </ol>
            <button 
              onClick={() => window.location.reload()}
              className="w-full mt-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              Refresh Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] relative overflow-x-hidden">
        <Navbar 
          onSearch={() => {}} 
          onHome={() => {}} 
        />
        <HeroSkeleton />
        <div className="relative z-10 px-6 lg:px-12 py-20 lg:-mt-20 space-y-28">
          <section>
            <div className="flex items-baseline gap-3 mb-12 bg-white/5 w-64 h-10 rounded animate-pulse" />
            <MovieListSkeleton />
          </section>
          <section>
            <div className="flex items-baseline gap-3 mb-12 bg-white/5 w-64 h-10 rounded animate-pulse" />
            <MovieListSkeleton />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-x-hidden">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] mesh-indigo pointer-events-none z-0" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] mesh-rose pointer-events-none z-0" />
      
      <Navbar 
        onSearch={handleSearch} 
        onHome={() => {
          setSearchResults(null);
          setCurrentView('home');
        }} 
        onWatchlistToggle={() => setCurrentView(currentView === 'watchlist' ? 'home' : 'watchlist')}
        onLoginClick={() => setShowLogin(true)}
        onProfileClick={() => setCurrentView(currentView === 'profile' ? 'home' : 'profile')}
        onAdvancedSearchClick={() => setCurrentView(currentView === 'search' ? 'home' : 'search')}
      />

      <AnimatePresence mode="wait">
        {currentView === 'profile' ? (
          <div key="profile-view">
            <Suspense fallback={null}>
              <ProfilePage 
                onSelectMovie={setSelectedMovie} 
                onClose={() => setCurrentView('home')} 
              />
            </Suspense>
          </div>
        ) : currentView === 'watchlist' ? (
          <motion.div
            key="watchlist-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pt-32 px-6 lg:px-12 pb-20 min-h-screen"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <Heart className="w-8 h-8 text-indigo-400 fill-indigo-400" />
              </div>
              <h2 className="text-4xl font-bold font-display uppercase tracking-tighter">
                My <span className="text-brand-accent italic">Watchlist</span>
              </h2>
            </div>

            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                {watchlist.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 opacity-40">
                <Heart className="w-16 h-16 mb-6 stroke-1" />
                <p className="text-xl font-light">Your watchlist is currently empty.</p>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="mt-6 text-indigo-400 hover:underline text-sm font-bold uppercase tracking-widest"
                >
                  Discover Movies
                </button>
              </div>
            )}
          </motion.div>
        ) : currentView === 'privacy' ? (
          <Suspense fallback={null} key="privacy"><PrivacyPolicy /></Suspense>
        ) : currentView === 'terms' ? (
          <Suspense fallback={null} key="terms"><TermsOfService /></Suspense>
        ) : currentView === 'search' ? (
          <Suspense fallback={null} key="search">
            <AdvancedSearch onSelectMovie={setSelectedMovie} genres={genres} />
          </Suspense>
        ) : searchResults ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="pt-32 px-6 lg:px-12 pb-20"
          >
            <h2 className="text-4xl font-bold font-display uppercase tracking-tighter mb-12 flex items-center gap-4">
              Search <span className="text-brand-accent italic">Results</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {searchResults.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-40">
                <p className="text-brand-secondary text-xl font-light">No movies found matching your request.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="home-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {trending[0] && <Hero movie={trending[0]} onDetails={setSelectedMovie} />}

            <div className="relative z-10 px-6 lg:px-12 py-20 lg:-mt-20 space-y-28">
              <Section 
                title="Trending" 
                subtitle="Now" 
                movies={trending.slice(1)} 
                onSelect={setSelectedMovie} 
              />
              <Section 
                title="Popular" 
                subtitle="Selection" 
                movies={popular} 
                onSelect={setSelectedMovie} 
                genres={genres}
                selectedGenre={popularGenre}
                onGenreChange={setPopularGenre}
                onLoadMore={() => setPopularPage(p => p + 1)}
                isLoadingMore={loadingPopular}
              />
              <Section 
                title="Critically" 
                subtitle="Acclaimed" 
                movies={topRated} 
                onSelect={setSelectedMovie} 
                genres={genres}
                selectedGenre={topRatedGenre}
                onGenreChange={setTopRatedGenre}
                onLoadMore={() => setTopRatedPage(p => p + 1)}
                isLoadingMore={loadingTopRated}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMovie && (
          <Suspense fallback={null}>
            <MovieDetails
              movie={selectedMovie}
              onClose={() => setSelectedMovie(null)}
              onSelectMovie={setSelectedMovie}
              onAuthRequired={() => setShowLogin(true)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </Suspense>

      <footer className="mt-20 border-t border-white/5 py-12 px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-brand-accent" />
            <span className="text-xl font-bold tracking-tighter uppercase font-display">
              Ciné<span className="text-brand-accent">phile</span>
            </span>
          </div>
          <p className="text-brand-secondary text-[10px] sm:text-xs font-medium tracking-widest uppercase">
            Powered by TMDB API • Crafted with Passion
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 text-[10px] tracking-widest font-black uppercase text-brand-secondary">
          <button onClick={() => setCurrentView('privacy')} className="hover:text-brand-accent transition-colors">Privacy Policy</button>
          <button onClick={() => setCurrentView('terms')} className="hover:text-brand-accent transition-colors">Terms of Service</button>
        </div>
      </footer>
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  movies: Movie[];
  onSelect: (m: Movie) => void;
  genres?: { id: number; name: string }[];
  selectedGenre?: number | null;
  onGenreChange?: (id: number | null) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function Section({ title, subtitle, movies, onSelect, genres, selectedGenre, onGenreChange, onLoadMore, isLoadingMore }: SectionProps) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div className="flex items-baseline gap-3">
          <h2 className="text-3xl font-bold font-display uppercase tracking-tight">{title}</h2>
          <span className="text-sm font-medium italic text-brand-accent opacity-80 uppercase tracking-widest">{subtitle}</span>
        </div>

        {genres && onGenreChange && (
          <div className="flex items-center gap-3">
            <CustomDropdown 
              label="Filter By"
              options={[
                { id: '', label: 'All Genres' },
                ...genres.map(g => ({ id: g.id, label: g.name }))
              ]}
              value={selectedGenre || ''}
              onChange={(val) => onGenreChange(val === '' ? null : val)}
              className="min-w-[160px]"
            />
          </div>
        )}
      </div>
      <div className="flex overflow-x-auto gap-4 sm:gap-8 pb-10 px-1 sm:px-0 scroll-smooth scroll-gpu overscroll-x-contain no-scrollbar">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={onSelect} />
        ))}
        {onLoadMore && movies.length > 0 && (
          <div className="flex-none w-36 sm:w-44 md:w-52 flex items-center justify-center pt-8 pb-16">
            <button 
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex flex-col items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 group-hover:border-white/80 group-hover:rotate-180 transition-all duration-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white">{isLoadingMore ? 'Loading...' : 'Load More'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
