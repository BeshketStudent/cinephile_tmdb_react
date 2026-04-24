export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
  status: string;
  budget?: number;
  revenue?: number;
  production_countries?: { name: string }[];
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}
