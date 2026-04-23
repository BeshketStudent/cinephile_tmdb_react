import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Movie } from '../types';
import { getImageUrl } from '../services/movieService';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  key?: React.Key;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="relative flex-none w-36 sm:w-44 md:w-52 cursor-pointer group"
      onClick={() => onClick(movie)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl glass-card shadow-lg transition-all duration-500 group-hover:border-white/30">
        <img
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span className="text-xs font-bold text-white/90">{movie.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h4 className="font-medium text-sm text-white/90 truncate group-hover:text-indigo-400 transition-colors">
          {movie.title}
        </h4>
        <p className="text-[11px] text-white/40 mt-0.5">
          {movie.release_date.split('-')[0]}
        </p>
      </div>
    </motion.div>
  );
}
