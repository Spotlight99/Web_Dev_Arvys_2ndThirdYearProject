import MovieAPI from "./api.js";
import Storage from "./storage.js";
import UI from "./ui.js";

const searchForm = document.querySelector(".search-panel");
const searchInput = document.querySelector(".search-input");
const searchSuggestions = document.querySelector(".search-suggestions");
const backToTopButton = document.querySelector(".back-to-top");
const recentContainer = document.querySelector(".chip-row");
const genreButtons = Array.from(document.querySelectorAll(".genre-chip"));
const HOME_ROWS = [
  { name: "Popular", genreId: null },
  { name: "Action", genreId: "28" },
  { name: "Adventure", genreId: "12" },
  { name: "Comedy", genreId: "35" },
  { name: "Drama", genreId: "18" },
  { name: "Sci-Fi", genreId: "878" },
  { name: "Horror", genreId: "27" },
  { name: "Animation", genreId: "16" },
  { name: "Fantasy", genreId: "14" },
  { name: "Crime", genreId: "80" },
  { name: "Romance", genreId: "10749" }
];
const resultsGrid = document.querySelector(".movie-grid");
const popularGrid = document.querySelector(".popular-grid");
const favoritesGrid = document.querySelector(".favorites-grid");
const genreRowsContainer = document.querySelector(".genre-rows");
const navShellEl = document.querySelector(".nav-shell");
const navSearchSlot = document.querySelector(".nav-search-slot");
const searchBarShell = document.querySelector(".search-bar-shell");
const topBannerEl = document.querySelector(".top-banner");
const trendingTrackEl = document.querySelector(".trending-track");
const resultsBack = document.querySelector(".results-back");
const discoverButton = document.querySelector(".favorites-discover");
const searchAgainButton = document.querySelector(".notfound-button");
const detailsBackButtons = Array.from(document.querySelectorAll(".details-back"));
const detailFavoriteButton = document.querySelector(".detail-favorite-button");
const themeButton = document.querySelector(".theme-button");
const TMDB_THUMBNAIL_BASE = "https://image.tmdb.org/t/p/w92";
let suggestionDebounce = null;
let suggestionSession = 0;
let trendingAutoScrollTimer = null;
let backToTopIdleTimer = null;
let navigationState = "top";
let navigationTransitionTimer = null;
let navigationScrollFrame = null;
let scrollGestureUntil = 0;
const SEARCH_DOCK_DURATION = 280;

const state = {
  route: "home",
  screen: "home",
  searchQuery: "",
  searchResults: [],
  popularMovies: [],
  genreRows: [],
  currentMovie: null,
  favorites: Storage.getFavorites(),
  recentSearches: Storage.getRecentSearches(),
  theme: Storage.getTheme() || "dark"
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", handleRouteChange);

async function init() {
  attachEventHandlers();
  handleScrollDocking();
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
    searchInput.addEventListener("focus", () => {
      suggestionSession += 1;
    });
  }
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);

  if (searchSuggestions) {
    searchSuggestions.addEventListener("click", handleSuggestionClick);
  }

  if (backToTopButton) {
    backToTopButton.addEventListener("click", handleBackToTopClick);
    ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
      window.addEventListener(eventName, revealBackToTopOnInteraction, { passive: true });
    });
  }

  window.addEventListener("scroll", handlePageScroll, { passive: true });
  ["wheel", "touchmove"].forEach((eventName) => {
    window.addEventListener(eventName, markScrollGesture, { passive: true });
  });

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

  if (genreRowsContainer) {
    genreRowsContainer.addEventListener("click", handleGenreRowsClick);
  }

  if (trendingTrackEl) {
    trendingTrackEl.addEventListener("click", handleTrendingBannerClick);
    trendingTrackEl.addEventListener("mouseenter", stopTrendingAutoScroll);
    trendingTrackEl.addEventListener("mouseleave", startTrendingAutoScroll);
    trendingTrackEl.addEventListener("touchstart", stopTrendingAutoScroll, { passive: true });
  }
}

function startTrendingAutoScroll() {
  if (!trendingTrackEl || trendingAutoScrollTimer) {
    return;
  }

  trendingAutoScrollTimer = setInterval(() => {
    if (!trendingTrackEl.children.length) {
      return;
    }
    const maxScroll = trendingTrackEl.scrollWidth - trendingTrackEl.clientWidth;
    if (trendingTrackEl.scrollLeft >= maxScroll - 5) {
      trendingTrackEl.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      const slideDistance = window.matchMedia("(max-width: 767px)").matches
        ? trendingTrackEl.clientWidth
        : 260;
      trendingTrackEl.scrollBy({ left: slideDistance, behavior: "smooth" });
    }
  }, 3500);
}

function stopTrendingAutoScroll() {
  if (trendingAutoScrollTimer) {
    clearInterval(trendingAutoScrollTimer);
    trendingAutoScrollTimer = null;
  }
}

function handleScrollDocking() {
  if (!navShellEl || !navSearchSlot || !searchBarShell || !topBannerEl) {
    return;
  }

  // The detail screen owns the cinematic hero; a docked search field would cut
  // across the poster and backdrop while the user is reading it.
  if (state.route === "details") {
    setNavigationState("top");
    return;
  }

  const bannerHeight = topBannerEl.offsetHeight;
  const dockThreshold = bannerHeight * 0.5;
  const releaseThreshold = bannerHeight * 0.42;
  const threshold = navigationState === "top" ? dockThreshold : releaseThreshold;
  setNavigationState(window.scrollY > threshold ? "docking" : "top");
}

function setNavigationState(nextState) {
  if (nextState === "docking" && navigationState === "sticky") {
    return;
  }

  if (nextState === navigationState) {
    return;
  }

  clearTimeout(navigationTransitionTimer);

  // One state machine owns the complete handoff. Resetting the menu prevents
  // a previously-open checkbox menu from surfacing during the dock animation.
  const navToggle = document.querySelector("#nav-toggle");
  if (navToggle) {
    navToggle.checked = false;
  }

  navigationState = nextState;

  if (nextState === "top") {
    navShellEl.classList.remove("nav-search-docking", "nav-search-active");
    topBannerEl.appendChild(searchBarShell);
    searchBarShell.classList.remove("in-nav");
    return;
  }

  if (nextState === "docking") {
    navShellEl.classList.remove("nav-search-active");
    navShellEl.classList.add("nav-search-docking");
    navSearchSlot.appendChild(searchBarShell);
    searchBarShell.classList.add("in-nav");
    navigationTransitionTimer = setTimeout(() => {
      if (navigationState !== "docking") {
        return;
      }
      navigationState = "sticky";
      navShellEl.classList.remove("nav-search-docking");
      navShellEl.classList.add("nav-search-active");
    }, SEARCH_DOCK_DURATION);
  }
}

function handlePageScroll() {
  if (navigationScrollFrame) {
    return;
  }

  navigationScrollFrame = window.requestAnimationFrame(() => {
    navigationScrollFrame = null;
    handleScrollDocking();
    handleScroll();
    // Mobile browsers may scroll the viewport while opening the keyboard. Only
    // blur after a real wheel/touch scroll gesture, never for that layout shift.
    dismissSearchSuggestions(performance.now() < scrollGestureUntil);
  });
}

function markScrollGesture() {
  scrollGestureUntil = performance.now() + 250;
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
  dismissSearchSuggestions();
  const hash = window.location.hash || "#home";
  const route = resolveRoute(hash);
  state.route = route.name;

  if (route.name === "details") {
    UI.setActiveNav(null);
    handleScrollDocking();
    loadMovieDetails(route.id);
    return;
  }

  if (route.name === "favorites") {
    UI.setActiveNav("#favorites");
    UI.renderFavorites(state.favorites);
    return;
  }

  UI.setActiveNav("#home");
  handleScrollDocking();
  renderHomeView();
}

async function loadPopularMovies() {
  UI.showLoading("home");
  try {
    const rows = await Promise.all(
      HOME_ROWS.map(async (row) => {
        const movies = row.genreId
          ? await MovieAPI.getMoviesByGenre(row.genreId)
          : await MovieAPI.getPopularMovies();
        return {
          name: row.name,
          genreId: row.genreId,
          movies: movies.slice(0, 12).map((movie) => ({ ...movie, isFavorite: isFavorite(movie.id) }))
        };
      })
    );
    state.genreRows = rows;
    const popularRow = rows.find((row) => row.genreId === null);
    state.popularMovies = popularRow ? popularRow.movies : [];
  } catch (error) {
    state.genreRows = [];
    state.popularMovies = [];
  }
}

async function loadTrendingMovie() {
  try {
    const movies = await MovieAPI.getTrendingMovies();
    UI.renderTrendingBanner(movies);
    startTrendingAutoScroll();
  } catch (error) {
    // leave the trending-track empty if this fails, the rest of the page still works
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

  UI.renderGenreRows(state.genreRows);
}

async function handleSearch(event) {
  event.preventDefault();
  const query = searchInput?.value.trim() || "";
  if (!query) {
    return;
  }

  dismissSearchSuggestions();
  await performSearch(query);
}

async function handleGenreClick(event) {
  const button = event.currentTarget;

  await selectGenre(button.dataset.genreId, button.textContent?.trim() || "");
}

async function selectGenre(genreId, genreName) {
  const matchingChip = genreButtons.find((button) => button.dataset.genreId === genreId);

  genreButtons.forEach((btn) => btn.classList.remove("active"));
  matchingChip?.classList.add("active");

  await openGenre(genreId, genreName);
}

async function openGenre(genreId, genreName) {
  if (genreId) {
    await performGenreSearch(genreId, genreName);
    return;
  }

  state.searchQuery = genreName || "Popular";
  UI.showLoading("search");

  try {
    const movies = await MovieAPI.getPopularMovies();
    state.searchResults = movies.map((movie) => ({ ...movie, isFavorite: isFavorite(movie.id) }));
    saveRecentSearch(state.searchQuery);
    state.screen = state.searchResults.length ? "results" : "notfound";
    navigateRoute("#home");
  } catch (error) {
    state.screen = "notfound";
    navigateRoute("#home");
  }
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

  const session = ++suggestionSession;
  suggestionDebounce = setTimeout(async () => {
    const movies = await MovieAPI.searchMovies(query);
    if (session !== suggestionSession || document.activeElement !== searchInput) {
      return;
    }
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
      (movie) => {
        const poster = movie.posterPath ? `${TMDB_THUMBNAIL_BASE}${movie.posterPath}` : "";
        return `<div class="search-suggestion-item" data-movie-id="${movie.id}" data-title="${movie.title}">
          ${poster ? `<img class="suggestion-poster" src="${poster}" alt="" loading="lazy">` : "<span class=\"suggestion-poster suggestion-poster-fallback\" aria-hidden=\"true\"><i class=\"fa-solid fa-film\"></i></span>"}
          <span class="suggestion-copy"><strong>${movie.title}</strong><span class="suggestion-year">Movie • ${movie.year || "N/A"}</span></span>
        </div>`
      }
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

function dismissSearchSuggestions(shouldBlurInput = true) {
  suggestionSession += 1;
  if (suggestionDebounce) {
    clearTimeout(suggestionDebounce);
    suggestionDebounce = null;
  }
  hideSuggestions();
  if (shouldBlurInput && document.activeElement === searchInput) {
    searchInput.blur();
  }
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

  dismissSearchSuggestions();
  performSearch(title);
}

function handleDocumentClick(event) {
  const clickedInsideSearch = event.target.closest(".search-panel");
  if (!clickedInsideSearch) {
    dismissSearchSuggestions();
  }

  const navToggle = document.querySelector("#nav-toggle");
  const clickedInsideNav = event.target.closest(".nav-shell");
  const clickedNavLink = event.target.closest(".nav-link");
  const clickedThemeButton = event.target.closest(".theme-button");

  if (navToggle && navToggle.checked) {
    if (!clickedInsideNav || clickedNavLink || clickedThemeButton) {
      navToggle.checked = false;
    }
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    dismissSearchSuggestions();
  }
}

function handleBackToTopClick() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleScroll() {
  if (!backToTopButton) {
    return;
  }

  if (window.scrollY <= 400) {
    clearTimeout(backToTopIdleTimer);
    backToTopButton.classList.remove("visible");
    return;
  }

  revealBackToTopOnInteraction();
}

function revealBackToTopOnInteraction() {
  if (!backToTopButton || window.scrollY <= 400) {
    return;
  }

  clearTimeout(backToTopIdleTimer);
  backToTopButton.classList.add("visible");
  backToTopIdleTimer = setTimeout(() => {
    backToTopButton.classList.remove("visible");
  }, 2500);
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

async function handleGenreRowsClick(event) {
  const allButton = event.target.closest(".carousel-all-link");
  if (allButton) {
    await selectGenre(allButton.dataset.genreId, allButton.dataset.genreName || "");
    return;
  }

  const favoriteButton = event.target.closest(".carousel-favorite");
  if (favoriteButton) {
    const movieId = favoriteButton.dataset.movieId;
    toggleFavorite(movieId);
    return;
  }

  const card = event.target.closest(".carousel-card");
  const movieId = card?.dataset.movieId;
  if (movieId) {
    navigateRoute(`#movie/${movieId}`);
  }
}

function handleTrendingBannerClick(event) {
  const card = event.target.closest(".trending-banner-card");
  const movieId = card?.dataset.movieId;
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
  UI.showLoading("search");

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
  UI.showLoading("search");

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
  UI.showLoading("details");
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
    const [trailerResult, providersResult] = await Promise.allSettled([
      MovieAPI.getMovieTrailer(movieId),
      MovieAPI.getWatchProviders(movieId)
    ]);
    if (state.currentMovie?.id !== movie.id) return;
    UI.renderTrailer(trailerResult.status === "fulfilled" ? trailerResult.value : null);
    UI.renderWatchProviders(providersResult.status === "fulfilled" ? providersResult.value : null);
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
  if (state.screen === "home" && state.route !== "details") {
    state.genreRows = state.genreRows.map((row) => ({
      ...row,
      movies: row.movies.map((movie) => ({ ...movie, isFavorite: isFavorite(movie.id) }))
    }));
    UI.renderGenreRows(state.genreRows);
  }
  if (state.route === "favorites") {
    UI.renderFavorites(state.favorites);
  }

  if (state.currentMovie?.id === movieId) {
    UI.updateDetailFavorite(isFavorite(movieId));
  }
}

function getMovieById(movieId) {
  const genreMovie = state.genreRows
    .flatMap((row) => row.movies)
    .find((movie) => movie.id === movieId);

  return (
    state.searchResults.find((movie) => movie.id === movieId) ||
    state.popularMovies.find((movie) => movie.id === movieId) ||
    genreMovie ||
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
  dismissSearchSuggestions();
  if (window.location.hash === hash) {
    handleRouteChange();
    return;
  }
  window.location.hash = hash;
}

export default state;
