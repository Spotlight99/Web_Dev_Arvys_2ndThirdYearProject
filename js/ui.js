/* ui.js
   UI rendering helpers for SpotexTV.
   Controls screen visibility and renders TMDB result content. */

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const UI = {
  get elements() {
    return {
      home: document.querySelector("#home"),
      favorites: document.querySelector("#favorites"),
      results: document.querySelector("#results"),
      details: document.querySelector("#details"),
      loading: document.querySelector("#loading"),
      notFound: document.querySelector("#notfound"),
      resultsGrid: document.querySelector(".movie-grid"),
      favoritesGrid: document.querySelector(".favorites-grid"),
      favoritesEmpty: document.querySelector(".favorites-empty"),
      recentSearches: document.querySelector(".chip-row"),
      resultsMeta: document.querySelector(".results-meta"),
      detailPoster: document.querySelector(".detail-poster"),
      detailTitle: document.querySelector(".detail-title"),
      detailSubtitle: document.querySelector(".detail-subtitle"),
      detailOverview: document.querySelector(".detail-overview"),
      detailGenres: document.querySelector(".detail-genres"),
      detailDirector: document.querySelector(".detail-director"),
      detailActors: document.querySelector(".detail-actors"),
      detailScore: document.querySelector(".detail-score"),
      detailFavoriteButton: document.querySelector(".detail-favorite-button"),
      navLinks: Array.from(document.querySelectorAll(".nav-link")),
      themeButton: document.querySelector(".theme-button"),
      themeIcon: document.querySelector(".theme-button i")
    };
  },

  hideAllScreens() {
    const screens = ["home", "favorites", "results", "details", "loading", "notFound"];
    screens.forEach((screen) => {
      const element = this.elements[screen];
      if (element) {
        element.classList.add("hidden");
      }
    });
  },

  showScreen(screenName) {
    this.hideAllScreens();
    const screen = this.elements[screenName];
    if (screen) {
      screen.classList.remove("hidden");
    }
  },

  renderSearchResults(movies, query) {
    const { resultsGrid, resultsMeta } = this.elements;
    if (!resultsGrid || !resultsMeta) {
      return;
    }

    resultsGrid.innerHTML = movies
      .map((movie) => {
        const posterUrl = movie.posterPath ? `${IMAGE_BASE_URL}${movie.posterPath}` : "";
        const favoriteClass = movie.isFavorite ? " favorite-active" : "";
        return `
          <article class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster" style="background-image: url('${posterUrl}');"></div>
            <div class="movie-card-body">
              <div class="movie-card-meta">
                <span class="movie-score">${movie.rating}</span>
                <span>${movie.year}</span>
              </div>
              <h3 class="movie-title">${movie.title}</h3>
              <p class="movie-description">${movie.overview}</p>
              <div class="movie-card-controls">
                <button class="button button-secondary favorite-toggle${favoriteClass}" type="button" data-movie-id="${movie.id}" aria-label="Toggle favorite">
                  <i class="fa-${movie.isFavorite ? "solid" : "regular"} fa-heart"></i>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    resultsMeta.textContent = query ? `Showing results for "${query}"` : "";
    this.showScreen("results");
  },

  renderFavorites(favorites) {
    const { favoritesGrid, favoritesEmpty } = this.elements;
    if (!favoritesGrid || !favoritesEmpty) {
      return;
    }

    if (!favorites.length) {
      favoritesGrid.innerHTML = "";
      favoritesEmpty.classList.remove("hidden");
      this.showScreen("favorites");
      return;
    }

    const gridHtml = favorites
      .map((movie) => {
        const posterUrl = movie.posterPath ? `${IMAGE_BASE_URL}${movie.posterPath}` : "";
        return `
          <article class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster" style="background-image: url('${posterUrl}');"></div>
            <div class="movie-card-body">
              <div class="movie-card-meta">
                <span class="movie-score">${movie.rating}</span>
                <span>${movie.year}</span>
              </div>
              <h3 class="movie-title">${movie.title}</h3>
              <div class="movie-card-controls">
                <button class="button button-secondary favorite-remove" type="button" data-movie-id="${movie.id}">Remove</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    favoritesGrid.innerHTML = gridHtml;
    favoritesEmpty.classList.add("hidden");
    this.showScreen("favorites");
  },

  renderHome(movies) {
    const popularGrid = document.querySelector(".popular-grid");
    if (!popularGrid) {
      return;
    }

    popularGrid.innerHTML = movies
      .map((movie) => {
        const posterUrl = movie.posterPath ? `${IMAGE_BASE_URL}${movie.posterPath}` : "";
        const favoriteClass = movie.isFavorite ? " favorite-active" : "";
        return `
          <article class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster" style="background-image: url('${posterUrl}');"></div>
            <div class="movie-card-body">
              <div class="movie-card-meta">
                <span class="movie-score">${movie.rating}</span>
                <span>${movie.year}</span>
              </div>
              <h3 class="movie-title">${movie.title}</h3>
              <p class="movie-description">${movie.overview}</p>
              <div class="movie-card-controls">
                <button class="button button-secondary favorite-toggle${favoriteClass}" type="button" data-movie-id="${movie.id}" aria-label="Toggle favorite">
                  <i class="fa-${movie.isFavorite ? "solid" : "regular"} fa-heart"></i>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    this.showScreen("home");
  },

  renderGenreRows(rows) {
    const container = document.querySelector(".genre-rows");
    if (!container) {
      return;
    }

    container.innerHTML = rows
      .map((row) => {
        const cards = row.movies
          .map((movie) => {
            const posterUrl = movie.posterPath ? `${IMAGE_BASE_URL}${movie.posterPath}` : "";
            const favoriteClass = movie.isFavorite ? " favorite-active" : "";
            return `
              <article class="carousel-card" data-movie-id="${movie.id}">
                <div class="carousel-poster" style="background-image: url('${posterUrl}');">
                  <span class="carousel-score">${movie.rating}</span>
                  <button class="carousel-favorite${favoriteClass}" type="button" data-movie-id="${movie.id}" aria-label="Toggle favorite">
                    <i class="fa-${movie.isFavorite ? "solid" : "regular"} fa-heart"></i>
                  </button>
                </div>
                <div class="carousel-card-body">
                  <p class="carousel-title">${movie.title}</p>
                  <p class="carousel-year">${movie.year}</p>
                </div>
              </article>
            `;
          })
          .join("");

        return `
          <section class="carousel-row">
            <div class="carousel-row-header">
              <h2>${row.name}</h2>
              <a class="carousel-all-link" href="#" data-genre-id="${row.genreId || ""}">All ></a>
            </div>
            <div class="carousel-track">${cards}</div>
          </section>
        `;
      })
      .join("");

    this.showScreen("home");
  },

  renderTrendingBanner(movies) {
    const track = document.querySelector(".trending-track");
    if (!track || !movies?.length) {
      return;
    }

    track.innerHTML = movies
      .map((movie) => {
        const backdropUrl = movie.backdropPath ? `${IMAGE_BASE_URL}${movie.backdropPath}` : "";
        return `
          <article class="trending-banner-card" data-movie-id="${movie.id}" style="background-image: url('${backdropUrl}');">
            <div class="trending-banner-overlay">
              <span class="trending-banner-badge">HOT</span>
              <h3 class="trending-banner-title">${movie.title}</h3>
              <p class="trending-banner-meta">${movie.year} • ${movie.rating} ★ • ${movie.genreNames.join(", ")}</p>
            </div>
          </article>
        `;
      })
      .join("");
  },

  renderMovieDetails(movie, isFavorite) {
    const {
      detailPoster,
      detailTitle,
      detailSubtitle,
      detailOverview,
      detailGenres,
      detailDirector,
      detailActors,
      detailScore,
      detailFavoriteButton
    } = this.elements;

    if (!detailPoster || !detailTitle || !detailSubtitle || !detailOverview || !detailGenres || !detailDirector || !detailActors || !detailScore || !detailFavoriteButton) {
      return;
    }

    detailPoster.style.backgroundImage = movie.posterPath ? `url('${IMAGE_BASE_URL}${movie.posterPath}')` : "none";
    detailTitle.textContent = movie.title;
    detailSubtitle.textContent = `${movie.year} • ${movie.runtime} • ${movie.genres}`;
    detailOverview.textContent = movie.overview;
    detailGenres.textContent = movie.genres;
    detailDirector.textContent = movie.director;
    detailActors.textContent = movie.actors;
    detailScore.textContent = movie.rating;
    detailFavoriteButton.dataset.movieId = movie.id;
    detailFavoriteButton.innerHTML = `${isFavorite ? "<i class=\"fa-solid fa-heart\"></i>" : "<i class=\"fa-regular fa-heart\"></i>"} ${isFavorite ? "Remove Favorite" : "Add to Favorites"}`;

    this.showScreen("details");
  },

  updateFavoriteState(isFavoriteCallback = () => false) {
    const cards = document.querySelectorAll(".movie-card");
    cards.forEach((card) => {
      const id = card.dataset.movieId;
      const button = card.querySelector(".favorite-toggle");
      const icon = button?.querySelector("i");
      if (button && icon) {
        const isFavorite = isFavoriteCallback(id);
        button.classList.toggle("favorite-active", isFavorite);
        icon.className = `fa-${isFavorite ? "solid" : "regular"} fa-heart`;
      }
    });
  },

  updateDetailFavorite(isFavorite) {
    const { detailFavoriteButton } = this.elements;
    if (!detailFavoriteButton) {
      return;
    }
    detailFavoriteButton.innerHTML = `${isFavorite ? "<i class=\"fa-solid fa-heart\"></i>" : "<i class=\"fa-regular fa-heart\"></i>"} ${isFavorite ? "Remove Favorite" : "Add to Favorites"}`;
  },

  renderRecentSearches(searches) {
    const { recentSearches } = this.elements;
    if (!recentSearches) {
      return;
    }

    if (!searches.length) {
      recentSearches.innerHTML = "<span class=\"empty-state-text\">Try a search to populate recent terms.</span>";
      return;
    }

    recentSearches.innerHTML = searches
      .map((term) => `<button class="chip" type="button" data-search="${term}">${term}</button>`)
      .join("");
  },

  setActiveNav(hash) {
    const { navLinks } = this.elements;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  },

  showLoading() {
    this.showScreen("loading");
  },

  showHome() {
    this.showScreen("home");
  },

  showFavorites() {
    this.showScreen("favorites");
  },

  showNotFound() {
    this.showScreen("notFound");
  },

  applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const { themeIcon } = this.elements;
    if (!themeIcon) {
      return;
    }
    themeIcon.className = theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
};

export default UI;
