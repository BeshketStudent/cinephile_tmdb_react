import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Filter, Star, Calendar, Minus, Plus } from 'lucide-react';
import { Movie } from '../types';
import { movieService } from '../services/movieService';
import MovieCard from './MovieCard';
import { MovieListSkeleton } from './Skeletons';
import ReactSlider from 'react-slider';

// Module-level cache to preserve state when component unmounts
const searchCache = {
  results: [] as Movie[],
  yearRange: [1888, new Date().getFullYear()],
  ratingFrom: '',
  ratingTo: '',
  selectedGenres: [] as number[],
  page: 1,
  hasMore: true,
  lastScroll: 0
};
let isCacheValid = false;

interface AdvancedSearchProps {
  onSelectMovie: (movie: Movie) => void;
  genres: { id: number; name: string }[];
}

const RatingInput = ({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) => {
  const handleInc = () => {
    let num = parseFloat(value || '0');
    if (isNaN(num)) num = 0;
    onChange(Math.min(10, num + 1).toFixed(1));
  };
  const handleDec = () => {
    let num = parseFloat(value || '0');
    if (isNaN(num)) num = 0;
    onChange(Math.max(0, num - 1).toFixed(1));
  };

  return (
    <div className="relative flex items-stretch w-full bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all text-sm font-sans text-white/90">
      <button onClick={handleDec} className="px-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center">
        <Minus className="w-3 h-3" />
      </button>
      <input 
        type="number" 
        placeholder={placeholder} 
        min="0" max="10" step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-1 py-2 text-center focus:outline-none placeholder:text-white/20"
      />
      <button onClick={handleInc} className="px-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export default function AdvancedSearch({ onSelectMovie, genres }: AdvancedSearchProps) {
  const [results, setResults] = useState<Movie[]>(isCacheValid ? searchCache.results : []);
  const [loading, setLoading] = useState(!isCacheValid);
  const loadingRef = React.useRef(loading);
  const hasMoreRef = React.useRef(isCacheValid ? searchCache.hasMore : true);
  
  const currentYear = new Date().getFullYear();
  const [yearRange, setYearRange] = useState(isCacheValid ? searchCache.yearRange : [1888, currentYear]);
  const [ratingFrom, setRatingFrom] = useState(isCacheValid ? searchCache.ratingFrom : '');
  const [ratingTo, setRatingTo] = useState(isCacheValid ? searchCache.ratingTo : '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(isCacheValid ? searchCache.selectedGenres : []);
  const [page, setPage] = useState(isCacheValid ? searchCache.page : 1);
  const [hasMore, setHasMore] = useState(isCacheValid ? searchCache.hasMore : true);
  
  const initialMount = React.useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Restore scroll
  useEffect(() => {
    if (isCacheValid) {
      setTimeout(() => {
        window.scrollTo(0, searchCache.lastScroll);
      }, 50);
    }
    
    const handleScroll = () => {
      searchCache.lastScroll = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Cache
  useEffect(() => {
    searchCache.results = results;
    searchCache.yearRange = yearRange;
    searchCache.ratingFrom = ratingFrom;
    searchCache.ratingTo = ratingTo;
    searchCache.selectedGenres = selectedGenres;
    searchCache.page = page;
    searchCache.hasMore = hasMore;
    isCacheValid = true;
  }, [results, yearRange, ratingFrom, ratingTo, selectedGenres, page, hasMore]);

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
    setPage(1); // Reset page on filter change
  };

  const fetchMovies = useCallback(async (
    targetPage: number, 
    range: number[], 
    rFrom: string, 
    rTo: string, 
    genres: number[]
  ) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: targetPage.toString(),
        sort_by: 'popularity.desc'
      };

      params['primary_release_date.gte'] = `${range[0]}-01-01`;
      params['primary_release_date.lte'] = `${range[1]}-12-31`;
      
      if (rFrom) params['vote_average.gte'] = rFrom;
      if (rTo) params['vote_average.lte'] = rTo;
      if (genres.length > 0) params['with_genres'] = genres.join(',');

      const data = await movieService.discoverMovies(params);
      
      if (targetPage > 1) {
        setResults(prev => {
          const existingIds = prev.map(m => m.id);
          const newMovies = data.results.filter((m: Movie) => !existingIds.includes(m.id));
          return [...prev, ...newMovies];
        });
      } else {
        setResults(data.results);
      }
      
      setHasMore(data.page < data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      if (isCacheValid && results.length > 0) return;
    }

    const timeout = setTimeout(() => {
      fetchMovies(page, yearRange, ratingFrom, ratingTo, selectedGenres);
    }, page > 1 ? 0 : 500);

    return () => clearTimeout(timeout);
  }, [page, yearRange, ratingFrom, ratingTo, selectedGenres, fetchMovies]);

  // Infinite Scroll Observer using callback ref
  const observer = React.useRef<IntersectionObserver | null>(null);
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    if (node) {
      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
            setPage(p => p + 1);
          }
        },
        { threshold: 0.1 }
      );
      observer.current.observe(node);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 px-4 lg:px-8 pb-20 min-h-screen"
    >
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Filters Side Panel */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-8 glass-card p-6 rounded-3xl h-fit sticky top-28">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Filter className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight">Filters</h2>
          </div>

          {/* Year Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-white/50 font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Release Year</span>
              </div>
              <span className="text-white/80 font-sans tracking-normal">{yearRange[0]} - {yearRange[1]}</span>
            </div>
            <div className="px-3 pt-4 pb-2">
              <ReactSlider
                className="w-full h-1.5 bg-white/10 rounded-full relative"
                thumbClassName="w-5 h-5 bg-white border-[3px] border-indigo-500 rounded-full cursor-grab focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-shadow outline-none absolute top-[-7px]"
                trackClassName="h-1.5 rounded-full"
                renderTrack={(props, state) => (
                  <div {...props} className={`${props.className} ${state.index === 1 ? 'bg-indigo-500' : ''}`} />
                )}
                min={1888}
                max={currentYear}
                value={yearRange}
                onChange={(val) => setYearRange(val as number[])}
                onAfterChange={() => setPage(1)}
              />
            </div>
          </div>

          {/* Rating Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/50 font-bold uppercase tracking-widest">
              <Star className="w-4 h-4" />
              <span>User Rating</span>
            </div>
            <div className="flex items-center gap-3">
              <RatingInput 
                value={ratingFrom}
                onChange={(val) => { setRatingFrom(val); setPage(1); }}
                placeholder="0.0"
              />
              <span className="text-white/30 font-sans font-bold">-</span>
              <RatingInput 
                value={ratingTo}
                onChange={(val) => { setRatingTo(val); setPage(1); }}
                placeholder="10.0"
              />
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-3">
            <div className="text-sm text-white/50 font-bold uppercase tracking-widest">
              Genres
            </div>
            <div className="h-48 overflow-y-auto pr-2 space-y-2 rounded-xl no-scrollbar border border-white/5 bg-white/[0.02] p-2">
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedGenres.includes(genre.id)
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1">
          <div className="mb-6 flex items-baseline justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Discover Movies</h1>
          </div>
          
          {loading && page === 1 ? (
             <MovieListSkeleton />
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={onSelectMovie} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Filter className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-xl text-white/40 font-medium tracking-tight">No movies found matching your filters</p>
              <button 
                onClick={() => {
                  setYearRange([1888, currentYear]); setRatingFrom(''); setRatingTo(''); setSelectedGenres([]); setPage(1);
                }}
                className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div ref={observerTarget} className="mt-12 h-20 w-full flex items-center justify-center">
              {loading && hasMore && (
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin glow-border" />
              )}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
