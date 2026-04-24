import { useEffect, useState } from 'react';
import { X, Star, Clock, Calendar, Bookmark, Share2, Check, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie, MovieDetails as MovieDetailsType, Cast } from '../types';
import { movieService, getImageUrl } from '../services/movieService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface MovieDetailsProps {
  movie: Movie;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  onAuthRequired: () => void;
}

export default function MovieDetails({ movie, onClose, onSelectMovie, onAuthRequired }: MovieDetailsProps) {
  const { user } = useAuth();
  const [details, setDetails] = useState<MovieDetailsType | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setTrailer(null);
    setShowTrailer(false);
    
    Promise.all([
      movieService.getMovieDetails(movie.id),
      movieService.getMovieCredits(movie.id),
      movieService.getSimilarMovies(movie.id),
      movieService.getMovieVideos(movie.id)
    ]).then(([detailsData, creditsData, similarData, videosData]) => {
      setDetails(detailsData);
      setCast(creditsData.cast.slice(0, 8));
      setSimilar(similarData.results.slice(0, 6));
      
      const trailerVideo = videosData.results.find(
        (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      if (trailerVideo) {
        setTrailer(trailerVideo.key);
      }
      
      setLoading(false);
    });

    // Check if movie is in watchlist and fetch user rating
    if (user) {
      const watchlistRef = doc(db, 'users', user.uid, 'watchlist', movie.id.toString());
      getDoc(watchlistRef).then((docSnap) => {
        setIsInWatchlist(docSnap.exists());
      });

      const ratingRef = doc(db, 'users', user.uid, 'ratings', movie.id.toString());
      getDoc(ratingRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUserRating(docSnap.data().rating);
        } else {
          setUserRating(null);
        }
      });
    } else {
      setIsInWatchlist(false);
      setUserRating(null);
    }
  }, [movie, user]);

  const toggleWatchlist = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setActionLoading(true);
    const watchlistRef = doc(db, 'users', user.uid, 'watchlist', movie.id.toString());

    try {
      if (isInWatchlist) {
        await deleteDoc(watchlistRef);
        setIsInWatchlist(false);
      } else {
        await setDoc(watchlistRef, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          addedAt: serverTimestamp()
        });
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    const ratingRef = doc(db, 'users', user.uid, 'ratings', movie.id.toString());

    try {
      if (userRating === rating) {
        // Toggle off if same rating clicked
        await deleteDoc(ratingRef);
        setUserRating(null);
      } else {
        await setDoc(ratingRef, {
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          rating: rating,
          updatedAt: serverTimestamp()
        });
        setUserRating(rating);
      }
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto"
    >
      <AnimatePresence>
        {showTrailer && trailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 md:p-12"
          >
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <button 
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${trailer}?autoplay=1`}
                title="Movie Trailer"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Mesh Gradients */}
      <div className="absolute top-[-200px] left-[-200px] w-[800px] h-[800px] mesh-indigo pointer-events-none opacity-40 z-0" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] mesh-rose pointer-events-none opacity-30 z-0" />

      {/* Background Header */}
      <div className="relative h-[40vh] md:h-[65vh] w-full">
        <img
          src={getImageUrl(movie.backdrop_path)}
          alt={movie.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent" />
        
        {/* Controls */}
        <div className="absolute top-4 sm:top-8 left-0 right-0 flex justify-between px-4 sm:px-8 z-10">
          <button 
            onClick={onClose}
            className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all font-bold"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex gap-2 sm:gap-4">
            {trailer && (
              <button 
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span className="hidden sm:inline text-sm uppercase tracking-widest">Watch Trailer</span>
              </button>
            )}
            <button 
              onClick={toggleWatchlist}
              disabled={actionLoading}
              className={`p-2 sm:p-3 rounded-full backdrop-blur-xl border transition-all ${
                isInWatchlist 
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' 
                  : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isInWatchlist ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <button className="p-2 sm:p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-20 md:-mt-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Left: Poster */}
          <div className="lg:col-span-4 max-w-xs mx-auto lg:max-w-none">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/20 ring-1 ring-white/10"
            >
              <img
                src={getImageUrl(movie.poster_path, 'w780')}
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* Right: Detailed Info */}
          <div className="lg:col-span-8 pt-24 lg:pt-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10">Feature</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold font-display tracking-tighter mb-4 text-white/90">
                {movie.title}
              </h1>
              
              {details && (
                <div className="flex flex-col gap-6 mb-10">
                  <p className="text-xl italic text-white/60 font-normal">
                    {details.tagline}
                  </p>
                  
                  {trailer && (
                    <motion.button 
                      onClick={() => setShowTrailer(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-3 w-fit px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 backdrop-blur-md transition-all group"
                    >
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                      <span className="font-bold uppercase tracking-[0.2em] text-xs">Watch Official Trailer</span>
                    </motion.button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 sm:gap-8 mb-12 items-center">
                <div className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">TMDB Average</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 fill-indigo-400" />
                    <span className="text-lg sm:text-xl font-bold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:gap-2 border-l border-white/5 pl-4 sm:pl-8">
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Your Rating</span>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => handleRate(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                            star <= (hoverRating || userRating || 0)
                              ? 'text-rose-500 fill-rose-500 shadow-rose-500/50'
                              : 'text-white/10 fill-transparent'
                          } ${star <= (userRating || 0) && !hoverRating ? 'text-indigo-400 fill-indigo-400' : ''}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {details && (
                  <>
                    <div className="flex flex-col gap-1 sm:gap-2 border-l border-white/5 pl-4 sm:pl-8">
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Runtime</span>
                      <div className="flex items-center gap-2 text-white/40 font-medium">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-lg sm:text-xl text-white/90">{details.runtime} min</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2 border-l border-white/5 pl-4 sm:pl-8">
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Release</span>
                      <div className="flex items-center gap-2 text-white/40 font-medium">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-lg sm:text-xl text-white/90">{details.release_date.split('-')[0]}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {details && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-white/10 mt-8 mb-12">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">Country</span>
                    <span className="text-sm font-medium text-white/80">
                      {details.production_countries && details.production_countries.length > 0 
                        ? details.production_countries.map(c => c.name).join(', ') 
                        : 'Data not available'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">Budget</span>
                    <span className="text-sm font-medium text-white/80">
                      {details.budget ? `$${details.budget.toLocaleString()}` : 'Data not available'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">Box Office</span>
                    <span className="text-sm font-medium text-white/80">
                      {details.revenue ? `$${details.revenue.toLocaleString()}` : 'Data not available'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-12">
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4 font-bold">Synopsis</h3>
                  <p className="text-lg leading-relaxed text-white/70 font-medium max-w-3xl">
                    {movie.overview}
                  </p>
                </section>

                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6 font-bold">Starring</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {cast.map((actor) => (
                      <div key={actor.id} className="flex flex-col gap-3 group">
                        <div className="aspect-square rounded-2xl overflow-hidden glass-card transition-transform group-hover:scale-105">
                          {actor.profile_path ? (
                            <img
                              src={getImageUrl(actor.profile_path, 'w185')}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/20">Empty</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white/90">{actor.name}</p>
                          <p className="text-[11px] text-white/40 truncate italic">{actor.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Similar Movies Section */}
        <section className="mt-20">
          <h3 className="text-2xl font-bold font-display uppercase tracking-tight mb-8">Related Recommendations</h3>
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-8 scroll-smooth no-scrollbar px-1">
            {similar.map((m) => (
              <motion.div
                key={m.id}
                whileHover={{ y: -5 }}
                className="flex-none w-40 md:w-48 cursor-pointer"
                onClick={() => onSelectMovie(m)}
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 mb-3 shadow-lg">
                  <img
                    src={getImageUrl(m.poster_path, 'w342')}
                    alt={m.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs font-medium line-clamp-1 text-center">{m.title}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
