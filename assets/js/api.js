import { TMDB_API_KEY, BASE_URL, IMG_BASE_URL } from './config.js';
import { showToast } from './toast.js';
import { movies } from './state.js';

export const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation',
  35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy',
  36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War',
  37: 'Western'
};

export const movieDetailsCache = new Map();

export async function fetchMovies(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}&language=en-US`);
    if (!response.ok) throw new Error('API error: ' + response.status);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('fetchMovies failed:', error);
    return [];
  }
}

export function mapTmdbMovie(tmdbMovie) {
  const genreNames = (tmdbMovie.genre_ids || [])
    .map(id => TMDB_GENRE_MAP[id])
    .filter(Boolean);

  const movie = {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || 'Unknown',
    rating: tmdbMovie.vote_average || 0,
    poster: tmdbMovie.poster_path ? IMG_BASE_URL + tmdbMovie.poster_path : '',
    backdrop: tmdbMovie.backdrop_path || '',
    genre: genreNames[0] || 'Drama',
    genres: genreNames.length ? genreNames : ['Drama'],
    desc: tmdbMovie.overview || 'No description available.',
    year: tmdbMovie.release_date ? tmdbMovie.release_date.split('-')[0] : '—',
    inWatchlist: false,
    isFav: false
  };

  const existing = movies.find(mv => mv.id === movie.id || mv.title === movie.title);
  if (existing) {
    existing.rating = movie.rating;
    existing.poster = movie.poster;
    existing.backdrop = movie.backdrop;
    existing.genre  = movie.genre;
    existing.genres = movie.genres;
    existing.desc   = movie.desc;
    existing.year   = movie.year;
    return existing;
  }
  return movie;
}

export async function fetchMovieDetails(movieId) {
  if (movieDetailsCache.has(movieId)) {
    return movieDetailsCache.get(movieId);
  }

  try {
    const [details, credits] = await Promise.all([
      fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json())
    ]);

    const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';
    const cast = credits.cast?.slice(0, 4).map(p => p.name).join(', ') || 'Unknown';
    const runtime = details.runtime ? `${Math.floor(details.runtime/60)}h ${details.runtime%60}m` : '—';
    const year = details.release_date ? details.release_date.split('-')[0] : '—';

    const result = { director, cast, runtime, year, backdropPath: details.backdrop_path };
    movieDetailsCache.set(movieId, result);
    return result;
  } catch (err) {
    console.error('fetchMovieDetails failed:', err);
    return null;
  }
}

export async function loadTrailer(movieId) {
  try {
    const data = await fetch(
      `${BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    ).then(r => r.json());

    const trailer = data.results?.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    ) || data.results?.[0];

    if (!trailer) {
      showToast('No trailer found for this movie.', 'yellow');
      return;
    }

    const frame     = document.getElementById('trailerFrame');
    const container = document.getElementById('trailerContainer');

    frame.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    container.classList.add('show');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    showToast('Could not load trailer.', 'yellow');
  }
}
