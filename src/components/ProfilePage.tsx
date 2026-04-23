import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Star, Heart, Calendar, AtSign, Settings, Film, Filter, SortAsc, SortDesc } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Movie } from '../types';
import MovieCard from './MovieCard';
import CustomDropdown from './ui/CustomDropdown';

interface RatedMovie extends Movie {
  userRating: number;
}

interface ProfilePageProps {
  onSelectMovie: (movie: Movie | null) => void;
  onClose: () => void;
}

export default function ProfilePage({ onSelectMovie, onClose }: ProfilePageProps) {
  const { user } = useAuth();
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating-desc' | 'rating-asc' | 'title-asc' | 'title-desc' | 'date-desc' | 'date-asc'>('rating-desc');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Memoized processed movies
  const processedMovies = useMemo(() => {
    let result = [...ratedMovies];

    // Filtering
    if (filterRating !== null) {
      result = result.filter(m => m.userRating === filterRating);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc': return b.userRating - a.userRating;
        case 'rating-asc': return a.userRating - b.userRating;
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        case 'date-desc': return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case 'date-asc': return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
        default: return 0;
      }
    });

    return result;
  }, [ratedMovies, sortBy, filterRating]);

  useEffect(() => {
    if (!user) return;

    // Fetch Ratings
    const ratingsQuery = query(
      collection(db, 'users', user.uid, 'ratings'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
      const items: RatedMovie[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: data.movieId,
          title: data.title || 'Unknown Title', // Fallback if title wasn't saved in rating doc
          poster_path: data.poster_path || '',
          vote_average: data.vote_average || 0,
          release_date: data.release_date || '',
          userRating: data.rating
        } as RatedMovie);
      });
      setRatedMovies(items);
      setLoading(false);
    });

    // Fetch Watchlist Count
    const watchlistQuery = query(collection(db, 'users', user.uid, 'watchlist'));
    const unsubscribeWatchlist = onSnapshot(watchlistQuery, (snapshot) => {
      setWatchlistCount(snapshot.size);
    });

    return () => {
      unsubscribeRatings();
      unsubscribeWatchlist();
    };
  }, [user]);

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-32 px-6 lg:px-12 pb-20 min-h-screen relative z-10"
    >
      {/* Header / User Info */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-16">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500" />
            <img 
              src={user.photoURL || ''} 
              alt={user.displayName || 'User'} 
              className="relative w-32 h-32 rounded-full border-2 border-white/10"
            />
            <div className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full border-2 border-[#050505]">
              <Settings className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              Premium Member
            </div>
            <h1 className="text-5xl font-bold font-display tracking-tighter uppercase leading-none">
              {user.displayName}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-center">
              <div className="text-2xl font-bold text-white">{watchlistCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Watchlist</div>
            </div>
            <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-center">
              <div className="text-2xl font-bold text-white">{ratedMovies.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Rated</div>
            </div>
          </div>
        </div>

        {/* Content Tabs / Sections */}
        <div className="space-y-16">
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <Star className="w-6 h-6 text-rose-500 fill-rose-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-display uppercase tracking-tight">
                    Your <span className="text-brand-accent italic">Ratings</span>
                  </h2>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">
                    Showing {processedMovies.length} {processedMovies.length === 1 ? 'movie' : 'movies'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Sort Dropdown */}
                <CustomDropdown 
                  options={[
                    { id: 'rating-desc', label: 'Highest Rated' },
                    { id: 'rating-asc', label: 'Lowest Rated' },
                    { id: 'title-asc', label: 'Title (A-Z)' },
                    { id: 'title-desc', label: 'Title (Z-A)' },
                    { id: 'date-desc', label: 'Newest First' },
                    { id: 'date-asc', label: 'Oldest First' }
                  ]}
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  className="min-w-[180px]"
                />

                {/* Filter Rating */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => setFilterRating(null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filterRating === null ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white'}`}
                  >
                    All
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button 
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition-all ${filterRating === rating ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      <span>{rating}</span>
                      <Star className={`w-3 h-3 ${filterRating === rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : processedMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                <AnimatePresence mode="popLayout">
                  {processedMovies.map((movie) => (
                    <motion.div 
                      key={movie.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group"
                    >
                      <MovieCard movie={movie} onClick={onSelectMovie} />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-500 rounded-lg text-[10px] font-bold text-white shadow-lg flex items-center gap-1 z-10">
                        <Star className="w-3 h-3 fill-current" />
                        {movie.userRating}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                {filterRating !== null ? (
                  <>
                    <Filter className="w-12 h-12 text-white/10 mb-4" />
                    <p className="text-white/30 font-medium">No movies found with a {filterRating}-star rating.</p>
                    <button 
                      onClick={() => setFilterRating(null)}
                      className="mt-4 text-indigo-400 font-bold hover:underline"
                    >
                      Clear Filter
                    </button>
                  </>
                ) : (
                  <>
                    <Star className="w-12 h-12 text-white/10 mb-4" />
                    <p className="text-white/30 font-medium">You haven't rated any movies yet.</p>
                    <button 
                      onClick={onClose}
                      className="mt-4 text-indigo-400 font-bold hover:underline"
                    >
                      Start Browsing
                    </button>
                  </>
                )}
              </div>
            )}
          </section>

          <section>
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <Heart className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold font-display uppercase tracking-tight">
                  Recently <span className="text-brand-accent italic">Saved</span>
                </h2>
              </div>
              <p className="text-white/30 text-sm mb-8">
                View your full collection by clicking the Heart icon in the navigation bar.
              </p>
              <button 
                onClick={() => onClose()} // This would need to set to watchlist mode, will handle in App.tsx
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <Film className="w-4 h-4" />
                Go to Watchlist
              </button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
