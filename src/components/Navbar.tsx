import { Search, Heart, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onSearch: (query: string) => void;
  onHome: () => void;
  onWatchlistToggle?: () => void;
  onLoginClick?: () => void;
  onProfileClick?: () => void;
}

export default function Navbar({ onSearch, onHome, onWatchlistToggle, onLoginClick, onProfileClick }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 transition-all duration-300 bg-white/5 backdrop-blur-xl border-b border-white/5 lg:px-12">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={onHome}
      >
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
          C
        </div>
        <span className="text-xl font-semibold tracking-tight text-white/90 font-display">
          Cinéphile
        </span>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search movies..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-48 lg:w-72 px-10 py-2.5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-md transition-all placeholder:text-white/20"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        </div>
        
        {user ? (
          <div className="flex items-center gap-2 lg:gap-6">
            <button 
              onClick={onWatchlistToggle}
              className="flex items-center gap-2 p-2 text-white/40 hover:text-white rounded-lg transition-all hover:bg-white/5"
            >
              <Heart className="w-6 h-6" />
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">Watchlist</span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <button 
                onClick={onProfileClick}
                className="relative group transition-all active:scale-95"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full blur opacity-0 group-hover:opacity-40 transition duration-300" />
                <img 
                  src={user.photoURL || ''} 
                  alt={user.displayName || 'User'} 
                  className="relative w-9 h-9 rounded-full border border-white/20"
                />
              </button>
              <button 
                onClick={logout}
                className="p-2 text-white/40 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all border border-white/10"
          >
            <UserIcon className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
