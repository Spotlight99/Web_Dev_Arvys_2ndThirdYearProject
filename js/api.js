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

const IS_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

async function request(endpoint, params = {}) {
  if (IS_LOCAL) {
    const { LOCAL_TMDB_API_KEY } = await import("./config.js");
    if (!LOCAL_TMDB_API_KEY || LOCAL_TMDB_API_KEY === "YOUR_TMDB_API_KEY") {
      throw new Error("Set your real key in js/config.js to test locally with Live Server.");
    }
    const query = new URLSearchParams({ api_key: LOCAL_TMDB_API_KEY, language: "en-US", ...params });
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  const query = new URLSearchParams({ path: endpoint, ...params });
  const response = await fetch(`/api/tmdb?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
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

  async getTrendingMovies() {
    const data = await request("/trending/movie/day", {});
    return (data.results || []).map(normalizeMovie).slice(0, 8);
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
