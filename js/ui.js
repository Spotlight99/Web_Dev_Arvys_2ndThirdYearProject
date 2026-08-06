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
      detailFacts: document.querySelector(".detail-facts"),
      detailCastList: document.querySelector(".detail-cast-list"),
      detailCast: document.querySelector(".detail-cast"),
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
        const genres = (movie.genreNames || []).join(" • ");
        return `
          <article class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster" style="background-image: url('${posterUrl}');">
              <span class="movie-score"><i class="fa-solid fa-star" aria-hidden="true"></i>${movie.rating}</span>
            </div>
            <div class="movie-card-body">
              <h3 class="movie-title">${movie.title}</h3>
              <div class="movie-card-meta"><span>${movie.year}</span>${genres ? `<span>${genres}</span>` : ""}</div>
              <p class="movie-description">${movie.overview}</p>
              <div class="movie-card-controls">
                <button class="button button-secondary favorite-toggle${favoriteClass}" type="button" data-movie-id="${movie.id}" aria-label="Toggle favorite">
                  <i class="fa-${movie.isFavorite ? "solid" : "regular"} fa-heart"></i>
                </button>
                <button class="button button-primary movie-details-button" type="button">View Details</button>
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
        const genres = Array.isArray(movie.genreNames)
          ? movie.genreNames
          : String(movie.genres || "").split(",").map((genre) => genre.trim()).filter(Boolean);
        return `
          <article class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster" style="background-image: url('${posterUrl}');">
              <span class="movie-score"><i class="fa-solid fa-star" aria-hidden="true"></i>${movie.rating}</span>
            </div>
            <div class="movie-card-body">
              <h3 class="movie-title">${movie.title}</h3>
              <div class="movie-card-meta"><span>${movie.year}</span><span>${movie.runtime || "Runtime N/A"}</span></div>
              <div class="movie-card-genres">${genres.map((genre) => `<span>${genre}</span>`).join("")}</div>
              <p class="movie-description">${movie.overview || "No description available."}</p>
              <div class="movie-card-controls">
                <button class="button button-secondary favorite-remove" type="button" data-movie-id="${movie.id}" aria-label="Remove ${movie.title} from favorites"><i class="fa-solid fa-heart" aria-hidden="true"></i></button>
                <button class="button button-primary movie-details-button" type="button">View Details</button>
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
              <button class="carousel-all-link" type="button" data-genre-id="${row.genreId || ""}" data-genre-name="${row.name}">All ></button>
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
      detailFacts,
      detailCastList,
      detailCast,
      detailFavoriteButton
    } = this.elements;

    if (!detailPoster || !detailTitle || !detailSubtitle || !detailOverview || !detailGenres || !detailDirector || !detailActors || !detailScore || !detailFavoriteButton) {
      return;
    }

    detailPoster.style.backgroundImage = movie.posterPath ? `url('${IMAGE_BASE_URL}${movie.posterPath}')` : "none";
    detailPoster.setAttribute("aria-label", `${movie.title} poster`);
    const detailPage = detailPoster.closest(".detail-page");
    if (detailPage) {
      detailPage.style.setProperty(
        "--detail-backdrop",
        movie.backdropPath ? `url('${IMAGE_BASE_URL}${movie.backdropPath}')` : "none"
      );
    }
    detailTitle.textContent = movie.title;
    detailSubtitle.innerHTML = [
      ["fa-solid fa-star", movie.rating],
      ["fa-regular fa-clock", movie.runtime],
      ["fa-regular fa-calendar", movie.year]
    ].filter(([, value]) => value && value !== "N/A").map(([icon, value]) =>
      `<span><i class="${icon}" aria-hidden="true"></i> ${value}</span>`
    ).join("");
    detailOverview.textContent = movie.overview;
    detailGenres.innerHTML = movie.genres
      .split(",")
      .filter((genre) => genre.trim() && genre.trim() !== "N/A")
      .map((genre) => `<span class="detail-genre-chip">${genre.trim()}</span>`)
      .join("");
    detailDirector.textContent = movie.director;
    detailActors.textContent = movie.actors;
    detailScore.textContent = movie.rating;
    detailScore.innerHTML = `<i class="fa-solid fa-star" aria-hidden="true"></i><span>${movie.rating}</span>`;
    if (detailFacts) {
      const facts = [
        ["fa-solid fa-chair", "Director", movie.director],
        ["fa-solid fa-language", "Language", movie.originalLanguage],
        ["fa-regular fa-calendar", "Release date", movie.releaseDate],
        ["fa-solid fa-fire", "Popularity", movie.popularity],
        ["fa-solid fa-clapperboard", "Status", movie.status],
        ["fa-regular fa-user", "Vote count", movie.voteCount]
      ].filter(([, , value]) => value && value !== "N/A");
      detailFacts.innerHTML = facts.map(([icon, label, value]) => `
        <div class="detail-fact"><i class="${icon}" aria-hidden="true"></i><div><span>${label}</span><strong>${value}</strong></div></div>
      `).join("");
    }
    if (detailCastList && detailCast) {
      const cast = (movie.cast || []).filter((person) => person.name);
      detailCast.classList.toggle("hidden", !cast.length);
      detailCastList.innerHTML = cast.map((person) => {
        const image = person.profilePath ? `${IMAGE_BASE_URL}${person.profilePath}` : "";
        const avatar = image
          ? `<img src="${image}" alt="${person.name}" loading="lazy">`
          : `<span aria-hidden="true">${person.name.charAt(0)}</span>`;
        return `<article class="detail-cast-member"><div class="detail-cast-avatar">${avatar}</div><strong>${person.name}</strong>${person.character ? `<span>${person.character}</span>` : ""}</article>`;
      }).join("");
    }
    detailFavoriteButton.dataset.movieId = movie.id;
    detailFavoriteButton.setAttribute("aria-label", isFavorite ? "Remove from favorites" : "Add to favorites");
    document.querySelectorAll(".details-back").forEach((button) => button.setAttribute("aria-label", "Back to home"));
    const trailerLink = document.querySelector(".detail-trailer-link");
    trailerLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} official trailer`)}`;
    trailerLink.setAttribute("aria-label", `Watch the trailer for ${movie.title} on YouTube`);
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
