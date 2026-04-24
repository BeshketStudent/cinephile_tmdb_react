/// <reference types="vite/client" />
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string, size: string = 'original') => 
  path ? `${IMAGE_BASE_URL}/${size}${path}` : 'https://via.placeholder.com/500x750?text=No+Poster';

async function tmdbRequest(endpoint: string, params: Record<string, string> = {}) {
  // Use a different variable name for the API key to avoid any shadowing confusion
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY;
  
  if (!tmdbKey) {
    const error = new Error('VITE_TMDB_API_KEY is not defined. Please add it to the Secrets panel in AI Studio.');
    (error as any).code = 'MISSING_API_KEY';
    throw error;
  }

  const queryParams = new URLSearchParams({
    api_key: tmdbKey,
    language: 'en-US',
    ...params,
  });

  const url = `${BASE_URL}${endpoint}?${queryParams}`;
  
  // Safely access fetch from the global scope
  const safeFetch = typeof window !== 'undefined' ? window.fetch : globalThis.fetch;
  
  if (typeof safeFetch !== 'function') {
    throw new Error('Global fetch API is not available in this environment.');
  }

  const response = await safeFetch(url);
  if (!response.ok) {
    throw new Error(`Movie Database Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const movieService = {
  getTrending: (page = 1) => tmdbRequest('/trending/movie/day', { page: page.toString() }),
  getPopular: (page = 1) => tmdbRequest('/movie/popular', { page: page.toString() }),
  getTopRated: (page = 1) => tmdbRequest('/movie/top_rated', { page: page.toString() }),
  getMovieDetails: (id: number) => tmdbRequest(`/movie/${id}`),
  getMovieCredits: (id: number) => tmdbRequest(`/movie/${id}/credits`),
  getSimilarMovies: (id: number) => tmdbRequest(`/movie/${id}/similar`),
  getMovieVideos: (id: number) => tmdbRequest(`/movie/${id}/videos`),
  searchMovies: (query: string, page = 1) => tmdbRequest('/search/movie', { query, page: page.toString() }),
  getGenres: () => tmdbRequest('/genre/movie/list'),
  discoverMovies: (params: Record<string, string>) => tmdbRequest('/discover/movie', params),
};
