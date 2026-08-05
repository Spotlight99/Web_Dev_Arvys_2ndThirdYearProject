import { TMDB_API_KEY } from "./config.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  35: "Comedy",
  18: "Drama",
  878: "Sci-Fi",
  27: "Horror",
  16: "Animation",
  14: "Fantasy",
  80: "Crime",
  10749: "Romance"
};

function ensureApiKey() {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY") {
    throw new Error("TMDB API key is missing. Set TMDB_API_KEY inside js/api.js before using the app.");
  }
}

function buildQueryParams(params = {}) {
  const query = new URLSearchParams({ api_key: TMDB_API_KEY, language: "en-US", ...params });
  return query.toString();
}

async function request(endpoint, params = {}) {
  ensureApiKey();
  const url = `${TMDB_BASE_URL}${endpoint}?${buildQueryParams(params)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function normalizeMovie(movie) {
  return {
    id: movie.id?.toString() || "",
    title: movie.title || movie.name || "Untitled",
    year: movie.release_date ? movie.release_date.slice(0, 4) : "N/A",
    rating: movie.vote_average ? movie.vote_average.toFixed(1) : "0.0",
    posterPath: movie.poster_path || "",
    backdropPath: movie.backdrop_path || "",
    overview: movie.overview || "No description available.",
    genres: movie.genre_ids || [],
    genreNames: (movie.genre_ids || []).slice(0, 2).map((id) => GENRE_MAP[id]).filter(Boolean)
  };
}

const MovieAPI = {
  async searchMovies(query) {
    if (!query || !query.trim()) {
      return [];
    }
    const data = await request("/search/movie", {
      query: query.trim(),
      include_adult: false,
      page: 1
    });
    return (data.results || []).map(normalizeMovie);
  },

  async getMovieDetails(id) {
    if (!id) {
      return null;
    }
    const data = await request(`/movie/${id}`, {
      append_to_response: "credits"
    });
    const director = data.credits?.crew?.find((person) => person.job === "Director")?.name || "N/A";
    const actors = (data.credits?.cast || []).slice(0, 5).map((actor) => actor.name).join(", ") || "N/A";
    const genres = (data.genres || []).map((genre) => genre.name).join(", ") || "N/A";
    return {
      id: data.id?.toString() || "",
      title: data.title || data.name || "Untitled",
      year: data.release_date ? data.release_date.slice(0, 4) : "N/A",
      rating: data.vote_average ? data.vote_average.toFixed(1) : "0.0",
      posterPath: data.poster_path || "",
      backdropPath: data.backdrop_path || "",
      overview: data.overview || "No description available.",
      runtime: data.runtime ? `${data.runtime} min` : "N/A",
      genres,
      director,
      actors
    };
  },

  async getPopularMovies() {
    const data = await request("/movie/popular", { page: 1 });
    return (data.results || []).map(normalizeMovie);
  },

  async getTrendingMovie() {
    const data = await request("/trending/movie/day", {});
    const results = (data.results || []).map(normalizeMovie);
    return results[0] || null;
  },

  async getMoviesByGenre(id) {
    if (!id) {
      return [];
    }
    const data = await request("/discover/movie", {
      with_genres: id,
      sort_by: "popularity.desc",
      page: 1
    });
    return (data.results || []).map(normalizeMovie);
  },

  getImageUrl(path) {
    return path ? `${TMDB_IMAGE_BASE}${path}` : "";
  }
};

export default MovieAPI;
