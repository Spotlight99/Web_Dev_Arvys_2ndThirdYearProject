import MovieAPI from "./api.js";
import Storage from "./storage.js";
import UI from "./ui.js";

const searchForm = document.querySelector(".search-panel");
const searchInput = document.querySelector(".search-input");
const searchSuggestions = document.querySelector(".search-suggestions");
const backToTopButton = document.querySelector(".back-to-top");
const recentContainer = document.querySelector(".chip-row");
const genreButtons = Array.from(document.querySelectorAll(".genre-chip"));
const resultsGrid = document.querySelector(".movie-grid");
const popularGrid = document.querySelector(".popular-grid");
const favoritesGrid = document.querySelector(".favorites-grid");
const resultsBack = document.querySelector(".results-back");
const discoverButton = document.querySelector(".favorites-discover");
const searchAgainButton = document.querySelector(".notfound-button");
const detailsBackButtons = Array.from(document.querySelectorAll(".details-back"));
const detailFavoriteButton = document.querySelector(".detail-favorite-button");
const themeButton = document.querySelector(".theme-button");
let suggestionDebounce = null;

const state = {
  route: "home",
  screen: "home",
  searchQuery: "",
  searchResults: [],
  popularMovies: [],
  currentMovie: null,
  favorites: Storage.getFavorites(),
  recentSearches: Storage.getRecentSearches(),
  theme: Storage.getTheme() || "dark"
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", handleRouteChange);

async function init() {
  attachEventHandlers();
  UI.applyTheme(state.theme);
  UI.renderRecentSearches(state.recentSearches);
  await loadPopularMovies();
  await loadTrendingMovie();
  handleRouteChange();
}

function attachEventHandlers() {
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
    document.addEventListener("click", handleClickOutsideSuggestions);
  }

  if (searchSuggestions) {
    searchSuggestions.addEventListener("click", handleSuggestionClick);
  }

  if (backToTopButton) {
    backToTopButton.addEventListener("click", handleBackToTopClick);
    window.addEventListener("scroll", handleScroll);
  }

  if (recentContainer) {
    recentContainer.addEventListener("click", handleRecentSearchClick);
  }

  genreButtons.forEach((button) => {
    button.addEventListener("click", handleGenreClick);
  });

  if (resultsBack) {
    resultsBack.addEventListener("click", () => {
      state.screen = "home";
      navigateRoute("#home");
    });
  }

  if (discoverButton) {
    discoverButton.addEventListener("click", () => {
      state.screen = "home";
      navigateRoute("#home");
    });
  }

  if (searchAgainButton) {
    searchAgainButton.addEventListener("click", () => {
      state.screen = "home";
      navigateRoute("#home");
    });
  }

  detailsBackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      navigateRoute("#home");
    });
  });

  if (detailFavoriteButton) {
    detailFavoriteButton.addEventListener("click", () => {
      const movieId = detailFavoriteButton.dataset.movieId;
      toggleFavorite(movieId);
    });
  }

  if (themeButton) {
    themeButton.addEventListener("click", handleThemeToggle);
  }

  if (resultsGrid) {
    resultsGrid.addEventListener("click", handleResultsGridClick);
  }

  if (popularGrid) {
    popularGrid.addEventListener("click", handleResultsGridClick);
  }

  if (favoritesGrid) {
    favoritesGrid.addEventListener("click", handleFavoritesGridClick);
  }
}

function resolveRoute(hash) {
  if (hash.startsWith("#movie/")) {
    return { name: "details", id: hash.split("#movie/")[1] };
  }

  if (hash === "#favorites") {
    return { name: "favorites" };
  }

  return { name: "home" };
}

function handleRouteChange() {
  const hash = window.location.hash || "#home";
  const route = resolveRoute(hash);
  state.route = route.name;

  if (route.name === "details") {
    UI.setActiveNav(null);
    loadMovieDetails(route.id);
    return;
  }

  if (route.name === "favorites") {
    UI.setActiveNav("#favorites");
    UI.renderFavorites(state.favorites);
    return;
  }

  UI.setActiveNav("#home");
  renderHomeView();
}

async function loadPopularMovies() {
  UI.showLoading();
  try {
    const movies = await MovieAPI.getPopularMovies();
    state.popularMovies = movies.map((movie) => ({ ...movie, isFavorite: isFavorite(movie.id) }));
  } catch (error) {
    state.popularMovies = [];
  }
}

async function loadTrendingMovie() {
  try {
    const movie = await MovieAPI.getTrendingMovie();
    UI.renderTrending(movie);
  } catch (error) {
    // leave the fallback markup already in index.html untouched
  }
}

function renderHomeView() {
  if (state.screen === "results") {
    UI.renderSearchResults(state.searchResults, state.searchQuery);
    return;
  }

  if (state.screen === "notfound") {
    UI.showNotFound();
    return;
  }

  UI.renderHome(state.popularMovies);
}

async function handleSearch(event) {
  event.preventDefault();
  const query = searchInput?.value.trim() || "";
  if (!query) {
    return;
  }

  await performSearch(query);
}

async function handleGenreClick(event) {
  const button = event.currentTarget;
  const genreId = button.dataset.genreId;
  const genreName = button.textContent?.trim() || "";

  if (!genreId) {
    return;
  }

  state.searchQuery = genreName;
  await performGenreSearch(genreId, genreName);
}

async function handleRecentSearchClick(event) {
  const chip = event.target.closest(".chip");
  if (!chip) {
    return;
  }

  const query = chip.dataset.search || "";
  if (!query) {
    return;
  }

  searchInput.value = query;
  await performSearch(query);
}

function handleSearchInput(event) {
  if (suggestionDebounce) {
    clearTimeout(suggestionDebounce);
  }

  const query = event.target.value.trim();
  if (query.length < 1) {
    hideSuggestions();
    return;
  }

  suggestionDebounce = setTimeout(async () => {
    const movies = await MovieAPI.searchMovies(query);
    renderSuggestions(movies.slice(0, 10));
  }, 350);
}

function renderSuggestions(movies) {
  if (!searchSuggestions) {
    return;
  }

  if (!movies.length) {
    hideSuggestions();
    return;
  }

  searchSuggestions.innerHTML = movies
    .map(
      (movie) =>
        `<div class="search-suggestion-item" data-movie-id="${movie.id}" data-title="${movie.title}">
          <span>${movie.title}</span>
          <span class="suggestion-year">(${movie.year || ""})</span>
        </div>`
    )
    .join("");

  searchSuggestions.classList.remove("hidden");
}

function hideSuggestions() {
  if (!searchSuggestions) {
    return;
  }

  searchSuggestions.classList.add("hidden");
  searchSuggestions.innerHTML = "";
}

function handleSuggestionClick(event) {
  const suggestion = event.target.closest(".search-suggestion-item");
  if (!suggestion) {
    return;
  }

  const title = suggestion.dataset.title || "";
  if (!title) {
    return;
  }

  if (searchInput) {
    searchInput.value = title;
  }

  hideSuggestions();
  performSearch(title);
}

function handleClickOutsideSuggestions(event) {
  const clickedInside = event.target.closest(".search-panel");
  if (!clickedInside) {
    hideSuggestions();
  }
}

function handleBackToTopClick() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleScroll() {
  if (!backToTopButton) {
    return;
  }
  backToTopButton.classList.toggle("visible", window.scrollY > 400);
}

function handleResultsGridClick(event) {
  const favoriteButton = event.target.closest(".favorite-toggle");
  if (favoriteButton) {
    const movieId = favoriteButton.dataset.movieId;
    toggleFavorite(movieId);
    return;
  }

  const movieCard = event.target.closest(".movie-card");
  const movieId = movieCard?.dataset.movieId;
  if (movieId) {
    navigateRoute(`#movie/${movieId}`);
  }
}

function handleFavoritesGridClick(event) {
  const removeButton = event.target.closest(".favorite-remove");
  if (removeButton) {
    const movieId = removeButton.dataset.movieId;
    toggleFavorite(movieId);
    return;
  }

  const movieCard = event.target.closest(".movie-card");
  const movieId = movieCard?.dataset.movieId;
  if (movieId) {
    navigateRoute(`#movie/${movieId}`);
  }
}

async function performSearch(query) {
  state.searchQuery = query.trim();
  UI.showLoading();

  try {
    const movies = await MovieAPI.searchMovies(state.searchQuery);
    state.searchResults = movies.map((movie) => ({ ...movie, isFavorite: isFavorite(movie.id) }));
    saveRecentSearch(state.searchQuery);

    if (!state.searchResults.length) {
      state.screen = "notfound";
      navigateRoute("#home");
      return;
    }

    state.screen = "results";
    navigateRoute("#home");
  } catch (error) {
    state.screen = "notfound";
    navigateRoute("#home");
  }
}

async function performGenreSearch(genreId, genreName) {
  state.searchQuery = genreName;
  UI.showLoading();

  try {
    const movies = await MovieAPI.getMoviesByGenre(genreId);
    state.searchResults = movies.map((movie) => ({ ...movie, isFavorite: isFavorite(movie.id) }));
    saveRecentSearch(state.searchQuery);

    if (!state.searchResults.length) {
      state.screen = "notfound";
      navigateRoute("#home");
      return;
    }

    state.screen = "results";
    navigateRoute("#home");
  } catch (error) {
    state.screen = "notfound";
    navigateRoute("#home");
  }
}

async function loadMovieDetails(movieId) {
  UI.showLoading();
  state.currentMovie = null;

  try {
    const movie = await MovieAPI.getMovieDetails(movieId);
    if (!movie) {
      state.screen = "notfound";
      navigateRoute("#home");
      return;
    }

    state.currentMovie = movie;
    UI.renderMovieDetails(movie, isFavorite(movie.id));
  } catch (error) {
    state.screen = "notfound";
    navigateRoute("#home");
  }
}

function toggleFavorite(movieId) {
  if (!movieId) {
    return;
  }

  const index = state.favorites.findIndex((movie) => movie.id === movieId);
  if (index >= 0) {
    state.favorites.splice(index, 1);
  } else {
    const movie = getMovieById(movieId);
    if (!movie) {
      return;
    }
    state.favorites.unshift({ ...movie });
  }

  Storage.saveFavorites(state.favorites);
  state.searchResults = state.searchResults.map((movie) => ({
    ...movie,
    isFavorite: isFavorite(movie.id)
  }));
  state.popularMovies = state.popularMovies.map((movie) => ({
    ...movie,
    isFavorite: isFavorite(movie.id)
  }));

  UI.updateFavoriteState((id) => isFavorite(id));
  if (state.screen === "home") {
    UI.renderHome(state.popularMovies);
  }
  if (state.route === "favorites") {
    UI.renderFavorites(state.favorites);
  }

  if (state.currentMovie?.id === movieId) {
    UI.updateDetailFavorite(isFavorite(movieId));
  }
}

function getMovieById(movieId) {
  return (
    state.searchResults.find((movie) => movie.id === movieId) ||
    state.popularMovies.find((movie) => movie.id === movieId) ||
    state.favorites.find((movie) => movie.id === movieId) ||
    (state.currentMovie?.id === movieId ? state.currentMovie : null)
  );
}

function isFavorite(movieId) {
  return state.favorites.some((movie) => movie.id === movieId);
}

function saveRecentSearch(query) {
  const normalized = query.trim();
  if (!normalized) {
    return;
  }

  state.recentSearches = [
    normalized,
    ...state.recentSearches.filter((term) => term.toLowerCase() !== normalized.toLowerCase())
  ].slice(0, 5);

  Storage.saveRecentSearches(state.recentSearches);
  UI.renderRecentSearches(state.recentSearches);
}

function handleThemeToggle() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  UI.applyTheme(state.theme);
  Storage.saveTheme(state.theme);
}

function navigateRoute(hash) {
  if (window.location.hash === hash) {
    handleRouteChange();
    return;
  }
  window.location.hash = hash;
}

export default state;
