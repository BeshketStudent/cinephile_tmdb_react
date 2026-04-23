import { Play, Info, Star, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Movie } from '../types';
import { getImageUrl } from '../services/movieService';

interface HeroProps {
  movie: Movie;
  onDetails: (movie: Movie) => void;
}

export default function Hero({ movie, onDetails }: HeroProps) {
  return (
    <section className="relative h-[85vh] w-full overflow-hidden flex items-end pb-24 px-6 lg:px-12 pt-32">
      {/* Background Image with Blur/Mask */}
      <div className="absolute inset-0 z-0">
        <img
          src={getImageUrl(movie.backdrop_path)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-[20s] animate-pulse"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="px-2.5 py-1 text-[10px] bg-brand-accent rounded text-white font-bold uppercase tracking-[0.2em]">Trending</span>
            <span className="text-white/60 text-sm font-medium tracking-wide">
              {movie.vote_average.toFixed(1)} Rating &bull; {movie.release_date.split('-')[0]}
            </span>
          </div>

          <h1 className="mb-6 text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-white/90 font-display text-shadow leading-[1.1] sm:leading-[0.9]">
            {movie.title}
          </h1>

          <p className="mb-10 text-base leading-relaxed text-white/60 font-medium max-w-lg">
            {movie.overview}
          </p>

          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-xl shadow-white/5"
            >
              Watch Now
            </motion.button>
            
            <motion.button
              onClick={() => onDetails(movie)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
            >
              View Details
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
